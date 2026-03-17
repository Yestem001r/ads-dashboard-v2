const express = require('express');
const cors = require('cors');
const { GoogleAdsApi } = require('google-ads-api');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
// Service-role client for server-side writes (bypasses RLS)
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

const APP_BASE_URL  = process.env.APP_BASE_URL  || 'http://localhost:3000';
const FRONTEND_URL  = process.env.FRONTEND_URL  || 'http://localhost:5173';


// --- GET SETTINGS ---
app.get('/api/settings/:userId', async (req, res) => {
    try {
        const { data, error } = await supabase.from('user_settings').select('*').eq('user_id', req.params.userId).single();
        if (error && error.code !== 'PGRST116') throw error;
        res.json(data ? {
            theme: data.theme,
            accentColor: data.accent_color,
            googleId: data.google_customer_id,
            googleLoginId: data.google_login_customer_id,
            googleConnected: !!data.google_refresh_token,
            metaId: data.meta_ad_account_id,
            metaAccessToken: data.meta_access_token,
            leadValue: data.lead_value
        } : { user_id: req.params.userId, leadValue: 120 });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- SAVE SETTINGS ---
app.post('/api/settings/save', async (req, res) => {
    const { userId, settings } = req.body;
    try {
        const { error } = await supabase.from('user_settings').upsert({
            user_id: userId,
            theme: settings.theme,
            accent_color: settings.accentColor,
            google_customer_id: settings.googleId,
            google_login_customer_id: settings.googleLoginId,
            meta_ad_account_id: settings.metaId,
            meta_access_token: settings.metaAccessToken,
            lead_value: Number(settings.leadValue)
        }, { onConflict: 'user_id' });
        if (error) throw error;
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- FETCH ANALYTICS ---
app.post('/api/analytics/fetch', async (req, res) => {
    const { dateFrom, dateTo, userId, level = 'campaign', source = 'all', saveSnapshot = false } = req.body;
    const { data: db } = await supabase.from('user_settings').select('*').eq('user_id', userId || 'test-user-1').single();

    const leadValue = db?.lead_value || 120;
    let combinedData = [];
    const lastSync = new Date().toISOString();
    let health = {
        google: { status: 'error', lastSync },
        meta:   { status: 'error', lastSync },
        flags:  []
    };

    // --- GOOGLE ADS ---
    if (source === 'all' || source === 'google') {
        try {
            if (!process.env.GOOGLE_ADS_CLIENT_ID || !process.env.GOOGLE_ADS_DEVELOPER_TOKEN || !db?.google_refresh_token || !db?.google_customer_id) {
                throw new Error('Google Ads not connected. Please connect your account in Settings.');
            }

            const client = new GoogleAdsApi({
                client_id:       process.env.GOOGLE_ADS_CLIENT_ID,
                client_secret:   process.env.GOOGLE_ADS_CLIENT_SECRET,
                developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
            });

            const customer = client.Customer({
                customer_id: db.google_customer_id.replace(/-/g, ''),
                refresh_token: db.google_refresh_token,
                login_customer_id: (db.google_login_customer_id || '').replace(/-/g, '') || undefined,
            });

            // Note: segments.date is intentionally omitted from WHERE to avoid empty results
            // when campaigns have no activity in the given date range (Google returns all-time
            // aggregated metrics in that case). Meta handles date filtering natively via time_range.
            let gaqlQuery;
            if (level === 'adgroup') {
                gaqlQuery = `
                    SELECT
                        ad_group.name,
                        campaign.name,
                        metrics.cost_micros,
                        metrics.conversions,
                        metrics.impressions,
                        metrics.clicks
                    FROM ad_group
                    WHERE ad_group.status = 'ENABLED'
                `;
            } else if (level === 'ad') {
                gaqlQuery = `
                    SELECT
                        ad_group_ad.ad.name,
                        ad_group_ad.ad.id,
                        ad_group.name,
                        metrics.cost_micros,
                        metrics.conversions,
                        metrics.impressions,
                        metrics.clicks
                    FROM ad_group_ad
                    WHERE ad_group_ad.status = 'ENABLED'
                `;
            } else {
                gaqlQuery = `
                    SELECT
                        campaign.name,
                        metrics.cost_micros,
                        metrics.conversions,
                        metrics.impressions,
                        metrics.clicks
                    FROM campaign
                    WHERE campaign.status = 'ENABLED'
                `;
            }

            const results = await customer.query(gaqlQuery);

            if (results) {
                console.log(`✅ Google: Found ${results.length} rows at level=${level}`);
                combinedData.push(...results.map(r => {
                    const spend       = (r.metrics.cost_micros || 0) / 1000000;
                    const clicks      = r.metrics.clicks || 0;
                    const impressions = r.metrics.impressions || 0;
                    const conversions = r.metrics.conversions || 0;

                    let name, parentName;
                    if (level === 'adgroup') {
                        name       = r.ad_group.name;
                        parentName = r.campaign.name;
                    } else if (level === 'ad') {
                        name       = r.ad_group_ad?.ad?.name || `Ad #${r.ad_group_ad?.ad?.id || '?'}`;
                        parentName = r.ad_group.name;
                    } else {
                        name       = r.campaign.name;
                        parentName = null;
                    }

                    return {
                        source: 'google',
                        level,
                        name,
                        parentName,
                        spend,
                        impressions,
                        clicks,
                        conversions,
                        ctr: impressions > 0 ? (clicks / impressions * 100) : 0,
                        cpc: clicks > 0 ? spend / clicks : 0,
                        date: dateTo
                    };
                }));
                health.google = { status: 'healthy', lastSync };
            }
        } catch (err) {
            console.error("🔴 Google Error:", err.message);
            health.google = { status: 'error', error: err.message, lastSync };
        }
    }

    // --- META ADS ---
    if (source === 'all' || source === 'meta') {
        try {
            if (!db?.meta_ad_account_id || !db?.meta_access_token) {
                throw new Error('Meta Ads credentials not configured. Please go to Settings and enter your API keys.');
            }

            const mAcc = db.meta_ad_account_id;
            const mTok = db.meta_access_token;

            let metaLevel, metaFields, nameKey, parentKey;
            if (level === 'adgroup') {
                metaLevel  = 'adset';
                metaFields = 'adset_name,campaign_name,spend,conversions,impressions,clicks';
                nameKey    = 'adset_name';
                parentKey  = 'campaign_name';
            } else if (level === 'ad') {
                metaLevel  = 'ad';
                metaFields = 'ad_name,adset_name,spend,conversions,impressions,clicks';
                nameKey    = 'ad_name';
                parentKey  = 'adset_name';
            } else {
                metaLevel  = 'campaign';
                metaFields = 'campaign_name,spend,conversions,impressions,clicks';
                nameKey    = 'campaign_name';
                parentKey  = null;
            }

            const resMeta = await axios.get(`https://graph.facebook.com/v18.0/${mAcc}/insights`, {
                params: {
                    access_token: mTok,
                    time_range: JSON.stringify({ since: dateFrom, until: dateTo }),
                    level: metaLevel,
                    fields: metaFields,
                    time_increment: 1
                }
            });

            if (resMeta.data.data && resMeta.data.data.length > 0) {
                console.log(`✅ Meta: Found ${resMeta.data.data.length} rows at level=${metaLevel}`);
                combinedData.push(...resMeta.data.data.map(r => {
                    const spend       = parseFloat(r.spend || 0);
                    const clicks      = parseInt(r.clicks || 0);
                    const impressions = parseInt(r.impressions || 0);
                    const conversions = r.conversions ? r.conversions.reduce((acc, c) => acc + Number(c.value), 0) : 0;
                    return {
                        source: 'meta',
                        level,
                        name:       r[nameKey],
                        parentName: parentKey ? r[parentKey] : null,
                        spend,
                        impressions,
                        clicks,
                        conversions,
                        ctr: impressions > 0 ? (clicks / impressions * 100) : 0,
                        cpc: clicks > 0 ? spend / clicks : 0,
                        date: r.date_start
                    };
                }));
                health.meta = { status: 'healthy', lastSync };
            } else {
                // Fallback: list campaigns when no insight data exists (campaign level only)
                if (level === 'campaign') {
                    const campaignsRes = await axios.get(`https://graph.facebook.com/v18.0/${mAcc}/campaigns`, {
                        params: { access_token: mTok, fields: 'name' }
                    });
                    if (campaignsRes.data.data) {
                        combinedData.push(...campaignsRes.data.data.map(c => ({
                            source: 'meta', level, name: c.name, parentName: null,
                            spend: 0, impressions: 0, clicks: 0, conversions: 0, ctr: 0, cpc: 0, date: dateTo
                        })));
                        health.meta = { status: 'healthy', lastSync };
                    }
                } else {
                    health.meta = { status: 'healthy', lastSync };
                }
            }
        } catch (err) {
            console.error("🔴 Meta Error:", err.message);
            health.meta = { status: 'error', error: err.message, lastSync };
        }
    }

    const final = combinedData.map(item => ({
        ...item,
        revenue: item.conversions * leadValue,
        profit:  (item.conversions * leadValue) - item.spend,
        roi:     item.spend > 0 ? (((item.conversions * leadValue) - item.spend) / item.spend) * 100 : 0
    }));

    // Data health flags: spend > 0 but no impressions tracked
    health.flags = final
        .filter(item => item.spend > 0 && item.impressions === 0)
        .reduce((acc, item) => {
            const key = `${item.source}::${item.name}`;
            if (!acc.seen.has(key)) {
                acc.seen.add(key);
                acc.list.push({ source: item.source, name: item.name, issue: 'spend_no_impressions' });
            }
            return acc;
        }, { seen: new Set(), list: [] }).list;

    // Optional snapshot: save aggregated totals for trend history (fire-and-forget)
    if (saveSnapshot && userId && final.length > 0 && level === 'campaign') {
        const totals = final.reduce((acc, item) => ({
            spend:       acc.spend       + parseFloat(item.spend || 0),
            impressions: acc.impressions + parseInt(item.impressions || 0),
            clicks:      acc.clicks      + parseInt(item.clicks || 0),
            conversions: acc.conversions + parseFloat(item.conversions || 0),
            revenue:     acc.revenue     + parseFloat(item.revenue || 0),
        }), { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 });

        const snapshotData = {
            ...totals,
            roas: totals.spend > 0 ? totals.revenue / totals.spend : 0,
            ctr:  totals.impressions > 0 ? (totals.clicks / totals.impressions * 100) : 0,
            cpc:  totals.clicks > 0 ? totals.spend / totals.clicks : 0,
        };

        supabaseAdmin.from('analytics_snapshots').upsert({
            user_id: userId,
            date:    dateTo,
            source,
            level,
            data:    snapshotData,
        }, { onConflict: 'user_id,date,source,level' }).then(({ error }) => {
            if (error) console.error('Snapshot save error:', error.message);
        });
    }

    res.json({ success: true, data: final, health });
});

// --- ANALYTICS HISTORY ---
app.get('/api/analytics/history', async (req, res) => {
    const { userId, source = 'all', level = 'campaign', days = 30 } = req.query;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    try {
        const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000)
            .toISOString().split('T')[0];

        const { data, error } = await supabaseAdmin
            .from('analytics_snapshots')
            .select('date, data')
            .eq('user_id', userId)
            .eq('source', source)
            .eq('level', level)
            .gte('date', since)
            .order('date', { ascending: true });

        if (error) throw error;

        const rows = (data || []).map(row => ({
            date:        row.date,
            spend:       row.data.spend,
            impressions: row.data.impressions,
            clicks:      row.data.clicks,
            conversions: row.data.conversions,
            roas:        row.data.roas,
            ctr:         row.data.ctr,
            cpc:         row.data.cpc,
        }));

        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- AI INSIGHTS ---
app.post('/api/insights/generate', async (req, res) => {
    const { userId, source = 'all', currentMetrics } = req.body;
    if (!userId || !currentMetrics) return res.status(400).json({ error: 'Missing userId or currentMetrics' });

    const fallbackInsights = (metrics) => ({
        summary: `Your campaigns spent $${(metrics.spend || 0).toFixed(0)}, generating ${metrics.conv || 0} leads at a ${metrics.roas || '0.00'}x ROAS in the selected period.`,
        anomalies: [],
        recommendations: [
            { priority: 'medium', action: 'Fetch data daily to unlock trend analysis', reason: 'Historical snapshots enable anomaly detection and richer AI insights over time.' }
        ],
        generatedAt: new Date().toISOString()
    });

    if (!process.env.ANTHROPIC_API_KEY) {
        return res.json({ success: true, insights: fallbackInsights(currentMetrics) });
    }

    try {
        // Fetch last 7 days of snapshots for context
        const { data: history } = await supabaseAdmin
            .from('analytics_snapshots')
            .select('date, data')
            .eq('user_id', userId)
            .eq('source', source)
            .eq('level', 'campaign')
            .order('date', { ascending: false })
            .limit(7);

        const Anthropic = require('@anthropic-ai/sdk');
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

        const insightsSchema = {
            name: 'report_insights',
            description: 'Report structured insights about ad campaign performance',
            input_schema: {
                type: 'object',
                properties: {
                    summary: {
                        type: 'string',
                        description: '2-3 sentence plain-English performance summary with specific numbers'
                    },
                    anomalies: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                metric:      { type: 'string' },
                                source:      { type: 'string' },
                                change:      { type: 'string', description: 'e.g. +42% or -18%' },
                                description: { type: 'string' }
                            },
                            required: ['metric', 'description']
                        }
                    },
                    recommendations: {
                        type: 'array',
                        maxItems: 3,
                        items: {
                            type: 'object',
                            properties: {
                                priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                                action:   { type: 'string' },
                                reason:   { type: 'string' }
                            },
                            required: ['priority', 'action', 'reason']
                        }
                    }
                },
                required: ['summary', 'anomalies', 'recommendations']
            }
        };

        const hasHistory = history && history.length > 0;
        const historySection = hasHistory
            ? `Historical trend (oldest first):\n${history.slice().reverse().map(h =>
                `  ${h.date}: spend=$${(h.data.spend || 0).toFixed(0)} impressions=${h.data.impressions || 0} clicks=${h.data.clicks || 0} conversions=${(h.data.conversions || 0).toFixed(1)} roas=${(h.data.roas || 0).toFixed(2)}x cpc=$${(h.data.cpc || 0).toFixed(2)}`
              ).join('\n')}`
            : 'No historical data available yet. Analyze the current period only and skip anomaly detection.';

        const prompt = `You are an expert digital advertising analyst for the ADCORE dashboard.
Analyze the following ad campaign performance data and call the report_insights tool.

Current period (${currentMetrics.dateFrom} to ${currentMetrics.dateTo}):
  Total spend: $${(currentMetrics.spend || 0).toFixed(2)}
  Impressions: ${currentMetrics.impressions || 0}
  Clicks: ${currentMetrics.clicks || 0}
  Leads/Conversions: ${currentMetrics.conv || 0}
  ROAS: ${currentMetrics.roas || '0.00'}x
  CTR: ${currentMetrics.ctr || '0.00'}%
  CPC: $${(currentMetrics.cpc || 0).toFixed(2)}

${historySection}

Rules:
- Detect anomalies only when a metric deviates more than 25% from the historical average.
- Provide 2-3 actionable recommendations prioritized by potential revenue impact.
- Keep the summary under 3 sentences. Be specific with numbers.
- If no historical data, skip anomaly detection entirely.
- Never invent data not provided above.`;

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 1024,
            tools: [insightsSchema],
            tool_choice: { type: 'any' },
            messages: [{ role: 'user', content: prompt }],
        });

        const toolUse = response.content.find(b => b.type === 'tool_use');
        const insights = toolUse?.input
            ? { ...toolUse.input, generatedAt: new Date().toISOString() }
            : fallbackInsights(currentMetrics);

        res.json({ success: true, insights });
    } catch (err) {
        console.error('Insights error:', err.message);
        res.json({ success: true, insights: fallbackInsights(currentMetrics) });
    }
});

// --- GOOGLE OAUTH START ---
app.get('/oauth/google/start', async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).send('Missing userId');

    if (!process.env.GOOGLE_ADS_CLIENT_ID) {
        return res.redirect(`${FRONTEND_URL}/settings?oauth=error&msg=${encodeURIComponent('Platform Google credentials not configured')}`);
    }

    const params = new URLSearchParams({
        client_id:     process.env.GOOGLE_ADS_CLIENT_ID,
        redirect_uri:  `${APP_BASE_URL}/oauth/callback`,
        response_type: 'code',
        scope:         'https://www.googleapis.com/auth/adwords',
        access_type:   'offline',
        prompt:        'consent',
        state:         userId,
    });

    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// --- GOOGLE OAUTH CALLBACK ---
app.get('/oauth/callback', async (req, res) => {
    const { code, state: userId, error: oauthError } = req.query;

    if (oauthError) {
        return res.redirect(`${FRONTEND_URL}/settings?oauth=error&msg=${encodeURIComponent(oauthError)}`);
    }
    if (!code || !userId) {
        return res.redirect(`${FRONTEND_URL}/settings?oauth=error&msg=${encodeURIComponent('Missing code or state')}`);
    }

    try {
        const response = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id:     process.env.GOOGLE_ADS_CLIENT_ID,
            client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
            redirect_uri:  `${APP_BASE_URL}/oauth/callback`,
            grant_type:    'authorization_code',
        });

        const { refresh_token } = response.data;

        if (!refresh_token) {
            return res.redirect(`${FRONTEND_URL}/settings?oauth=error&msg=${encodeURIComponent('No refresh token returned — try revoking app access at myaccount.google.com and retry')}`);
        }

        await supabaseAdmin.from('user_settings').upsert(
            { user_id: userId, google_refresh_token: refresh_token },
            { onConflict: 'user_id' }
        );

        res.redirect(`${FRONTEND_URL}/settings?oauth=success`);
    } catch (err) {
        const msg = err.response?.data?.error_description || err.message;
        res.redirect(`${FRONTEND_URL}/settings?oauth=error&msg=${encodeURIComponent(msg)}`);
    }
});

// --- LIST ACCESSIBLE GOOGLE ADS ACCOUNTS ---
app.get('/api/google/accounts', async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const { data: db } = await supabase
        .from('user_settings')
        .select('google_refresh_token')
        .eq('user_id', userId)
        .single();

    if (!db?.google_refresh_token) return res.json({ success: true, accounts: [] });

    try {
        const client = new GoogleAdsApi({
            client_id:       process.env.GOOGLE_ADS_CLIENT_ID,
            client_secret:   process.env.GOOGLE_ADS_CLIENT_SECRET,
            developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
        });

        const { resource_names } = await client.listAccessibleCustomers(db.google_refresh_token);

        const accounts = await Promise.all((resource_names || []).map(async (rn) => {
            const customerId = rn.replace('customers/', '');
            try {
                const customer = client.Customer({ customer_id: customerId, refresh_token: db.google_refresh_token });
                const [details] = await customer.query(
                    `SELECT customer.id, customer.descriptive_name, customer.manager FROM customer LIMIT 1`
                );
                return {
                    id:        customerId,
                    name:      details?.customer?.descriptive_name || `Account ${customerId}`,
                    isManager: details?.customer?.manager || false,
                };
            } catch {
                return { id: customerId, name: `Account ${customerId}`, isManager: false };
            }
        }));

        res.json({ success: true, accounts });
    } catch (err) {
        console.error('List accounts error:', err.message);
        res.json({ success: true, accounts: [], error: err.message });
    }
});

// --- DISCONNECT GOOGLE ADS ---
app.post('/api/google/disconnect', async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    try {
        await supabaseAdmin.from('user_settings').upsert(
            { user_id: userId, google_refresh_token: null, google_customer_id: null, google_login_customer_id: null },
            { onConflict: 'user_id' }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve frontend static files
const path = require('path');
const fs = require('fs');
const frontendDist = path.join(__dirname, 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get('*', (_req, res) => {
        res.sendFile(path.join(frontendDist, 'index.html'));
    });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server Running on Port ${PORT}`));
