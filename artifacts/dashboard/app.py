import os
import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
from datetime import datetime, timedelta
from massive import RESTClient

API_KEY = os.environ.get("MASSIVE_API_KEY", "")

st.set_page_config(
    page_title="Market Overview",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="collapsed",
)

st.markdown("""
<style>
.metric-card {
    background: #1E293B;
    border-radius: 12px;
    padding: 1rem 1.25rem;
    border: 1px solid #334155;
}
.positive { color: #22C55E; }
.negative { color: #EF4444; }
.neutral  { color: #94A3B8; }
.market-open  { color: #22C55E; font-weight: 600; }
.market-closed { color: #EF4444; font-weight: 600; }
.section-header {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #64748B;
    margin-bottom: 0.5rem;
}
div[data-testid="stMetric"] {
    background: #1E293B;
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 0.75rem 1rem;
}
</style>
""", unsafe_allow_html=True)


@st.cache_resource
def get_client():
    return RESTClient(API_KEY)


@st.cache_data(ttl=60)
def fetch_market_status():
    client = get_client()
    try:
        resp = client.get_market_status()
        return resp
    except Exception as e:
        return None


@st.cache_data(ttl=60)
def fetch_indices():
    client = get_client()
    try:
        tickers = "I:SPX,I:NDX,I:DJI,I:RUT,I:VIX"
        resp = client.get_snapshot_indices(ticker_any_of=tickers)
        return resp.results if hasattr(resp, "results") else []
    except Exception as e:
        return []


@st.cache_data(ttl=60)
def fetch_stock_movers(direction):
    client = get_client()
    try:
        resp = client.get_snapshot_direction(market_type="stocks", direction=direction)
        tickers = resp.tickers if hasattr(resp, "tickers") else []
        return tickers[:10]
    except Exception as e:
        return []


@st.cache_data(ttl=60)
def fetch_crypto_movers(direction):
    client = get_client()
    try:
        resp = client.get_snapshot_direction(market_type="crypto", direction=direction)
        tickers = resp.tickers if hasattr(resp, "tickers") else []
        return tickers[:8]
    except Exception as e:
        return []


@st.cache_data(ttl=300)
def fetch_treasury_yields():
    client = get_client()
    try:
        today = datetime.now().strftime("%Y-%m-%d")
        thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        resp = client.get_treasury_yields(
            params={
                "date.gte": thirty_days_ago,
                "date.lte": today,
                "sort": "date.desc",
                "limit": 5,
            }
        )
        if hasattr(resp, "results") and resp.results:
            return resp.results[0]
        return None
    except Exception as e:
        return None


@st.cache_data(ttl=300)
def fetch_ohlc(ticker, days=30):
    client = get_client()
    try:
        today = datetime.now().strftime("%Y-%m-%d")
        from_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
        resp = client.get_aggs(
            ticker=ticker,
            multiplier=1,
            timespan="day",
            from_=from_date,
            to=today,
            adjusted=True,
            sort="asc",
            limit=50,
        )
        return resp.results if hasattr(resp, "results") else []
    except Exception as e:
        return []


def pct_color(val):
    if val is None:
        return "neutral"
    return "positive" if val >= 0 else "negative"


def fmt_pct(val):
    if val is None:
        return "—"
    sign = "+" if val >= 0 else ""
    return f"{sign}{val:.2f}%"


def fmt_price(val):
    if val is None:
        return "—"
    return f"{val:,.2f}"


# ── Header ─────────────────────────────────────────────────────────────────
now = datetime.now().strftime("%B %d, %Y  %I:%M %p")
col_title, col_time = st.columns([3, 1])
with col_title:
    st.title("📈 Market Overview")
with col_time:
    st.markdown(f"<p style='text-align:right;color:#64748B;padding-top:1.4rem;font-size:0.85rem;'>{now}</p>", unsafe_allow_html=True)

# ── Market Status ────────────────────────────────────────────────────────────
status = fetch_market_status()
if status:
    st.markdown('<p class="section-header">Market Status</p>', unsafe_allow_html=True)
    scols = st.columns(5)
    markets = [
        ("NYSE", getattr(status, "exchanges", {}).get("nyse") if hasattr(status, "exchanges") and isinstance(getattr(status, "exchanges", None), dict) else getattr(getattr(status, "exchanges", None), "nyse", None)),
        ("NASDAQ", getattr(status, "exchanges", {}).get("nasdaq") if hasattr(status, "exchanges") and isinstance(getattr(status, "exchanges", None), dict) else getattr(getattr(status, "exchanges", None), "nasdaq", None)),
        ("OTC", getattr(status, "exchanges", {}).get("otc") if hasattr(status, "exchanges") and isinstance(getattr(status, "exchanges", None), dict) else getattr(getattr(status, "exchanges", None), "otc", None)),
        ("Crypto", getattr(status, "currencies", {}).get("crypto") if hasattr(status, "currencies") and isinstance(getattr(status, "currencies", None), dict) else getattr(getattr(status, "currencies", None), "crypto", None)),
        ("Forex", getattr(status, "currencies", {}).get("fx") if hasattr(status, "currencies") and isinstance(getattr(status, "currencies", None), dict) else getattr(getattr(status, "currencies", None), "fx", None)),
    ]
    for col, (name, mstatus) in zip(scols, markets):
        mstatus = mstatus or "—"
        css = "market-open" if mstatus.lower() == "open" else ("market-closed" if mstatus.lower() in ("closed", "extended-hours") else "neutral")
        col.markdown(f"""
        <div class="metric-card">
            <div class="section-header">{name}</div>
            <div class="{css}" style="font-size:1.1rem;">{mstatus.title()}</div>
        </div>
        """, unsafe_allow_html=True)

st.markdown("---")

# ── Major Indices ─────────────────────────────────────────────────────────────
st.markdown('<p class="section-header">Major Indices</p>', unsafe_allow_html=True)
indices = fetch_indices()

INDEX_LABELS = {
    "I:SPX": "S&P 500",
    "I:NDX": "Nasdaq 100",
    "I:DJI": "Dow Jones",
    "I:RUT": "Russell 2000",
    "I:VIX": "VIX",
}

if indices:
    idx_cols = st.columns(len(indices))
    for col, idx in zip(idx_cols, indices):
        ticker = getattr(idx, "ticker", "")
        label = INDEX_LABELS.get(ticker, ticker)
        value = getattr(idx, "value", None)
        session = getattr(idx, "session", None)
        chg_pct = getattr(session, "change_percent", None) if session else None
        chg = getattr(session, "change", None) if session else None

        arrow = "▲" if (chg_pct or 0) >= 0 else "▼"
        css = pct_color(chg_pct)
        col.markdown(f"""
        <div class="metric-card">
            <div class="section-header">{label}</div>
            <div style="font-size:1.5rem;font-weight:700;">{fmt_price(value)}</div>
            <div class="{css}" style="font-size:0.9rem;">{arrow} {fmt_pct(chg_pct)}</div>
        </div>
        """, unsafe_allow_html=True)
else:
    st.info("Index data unavailable — check your API plan.")

st.markdown("---")

# ── S&P 500 30-day chart ──────────────────────────────────────────────────────
st.markdown('<p class="section-header">S&P 500 — 30-Day Price History</p>', unsafe_allow_html=True)
spx_bars = fetch_ohlc("SPY", days=30)
if spx_bars:
    df = pd.DataFrame([{
        "date": datetime.fromtimestamp(b.t / 1000).strftime("%b %d") if hasattr(b, "t") else "",
        "close": getattr(b, "c", None),
        "open": getattr(b, "o", None),
        "high": getattr(b, "h", None),
        "low": getattr(b, "l", None),
        "volume": getattr(b, "v", None),
    } for b in spx_bars])

    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=df["date"],
        y=df["close"],
        mode="lines",
        fill="tozeroy",
        line=dict(color="#3B82F6", width=2),
        fillcolor="rgba(59,130,246,0.1)",
        hovertemplate="<b>%{x}</b><br>Close: $%{y:,.2f}<extra></extra>",
    ))
    fig.update_layout(
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        margin=dict(l=0, r=0, t=10, b=0),
        height=260,
        xaxis=dict(showgrid=False, tickfont=dict(color="#64748B"), color="#64748B"),
        yaxis=dict(showgrid=True, gridcolor="#1E293B", tickfont=dict(color="#64748B"), color="#64748B"),
    )
    st.plotly_chart(fig, use_container_width=True)
else:
    st.info("Price history unavailable.")

st.markdown("---")

# ── Top Movers ────────────────────────────────────────────────────────────────
left, right = st.columns(2)

with left:
    st.markdown('<p class="section-header">📈 Top Stock Gainers</p>', unsafe_allow_html=True)
    gainers = fetch_stock_movers("gainers")
    if gainers:
        rows = []
        for t in gainers:
            rows.append({
                "Ticker": getattr(t, "ticker", ""),
                "Price": fmt_price(getattr(t, "day", None) and getattr(t.day, "c", None)),
                "Change %": getattr(t, "todaysChangePerc", None),
                "Volume": f"{int(getattr(t.day, 'v', 0) or 0):,}" if getattr(t, "day", None) else "—",
            })
        df_g = pd.DataFrame(rows)

        def color_pct(val):
            color = "#22C55E" if (val or 0) >= 0 else "#EF4444"
            return f"color: {color}"

        styled = df_g.style.applymap(color_pct, subset=["Change %"]).format({"Change %": lambda v: fmt_pct(v) if v is not None else "—"})
        st.dataframe(styled, use_container_width=True, hide_index=True)
    else:
        st.info("Gainer data unavailable.")

with right:
    st.markdown('<p class="section-header">📉 Top Stock Losers</p>', unsafe_allow_html=True)
    losers = fetch_stock_movers("losers")
    if losers:
        rows = []
        for t in losers:
            rows.append({
                "Ticker": getattr(t, "ticker", ""),
                "Price": fmt_price(getattr(t, "day", None) and getattr(t.day, "c", None)),
                "Change %": getattr(t, "todaysChangePerc", None),
                "Volume": f"{int(getattr(t.day, 'v', 0) or 0):,}" if getattr(t, "day", None) else "—",
            })
        df_l = pd.DataFrame(rows)

        def color_pct_neg(val):
            color = "#22C55E" if (val or 0) >= 0 else "#EF4444"
            return f"color: {color}"

        styled_l = df_l.style.applymap(color_pct_neg, subset=["Change %"]).format({"Change %": lambda v: fmt_pct(v) if v is not None else "—"})
        st.dataframe(styled_l, use_container_width=True, hide_index=True)
    else:
        st.info("Loser data unavailable.")

st.markdown("---")

# ── Crypto Movers ─────────────────────────────────────────────────────────────
st.markdown('<p class="section-header">Crypto — Top Movers</p>', unsafe_allow_html=True)
cg_col, cl_col = st.columns(2)

with cg_col:
    st.markdown("**🟢 Gainers**")
    crypto_gainers = fetch_crypto_movers("gainers")
    if crypto_gainers:
        rows = []
        for t in crypto_gainers:
            ticker = getattr(t, "ticker", "").replace("X:", "")
            rows.append({
                "Pair": ticker,
                "Price": fmt_price(getattr(t.day, "c", None) if getattr(t, "day", None) else None),
                "Change %": getattr(t, "todaysChangePerc", None),
            })
        df_cg = pd.DataFrame(rows)
        styled_cg = df_cg.style.applymap(color_pct, subset=["Change %"]).format({"Change %": lambda v: fmt_pct(v) if v is not None else "—"})
        st.dataframe(styled_cg, use_container_width=True, hide_index=True)
    else:
        st.info("Crypto gainer data unavailable.")

with cl_col:
    st.markdown("**🔴 Losers**")
    crypto_losers = fetch_crypto_movers("losers")
    if crypto_losers:
        rows = []
        for t in crypto_losers:
            ticker = getattr(t, "ticker", "").replace("X:", "")
            rows.append({
                "Pair": ticker,
                "Price": fmt_price(getattr(t.day, "c", None) if getattr(t, "day", None) else None),
                "Change %": getattr(t, "todaysChangePerc", None),
            })
        df_cl = pd.DataFrame(rows)
        styled_cl = df_cl.style.applymap(color_pct_neg, subset=["Change %"]).format({"Change %": lambda v: fmt_pct(v) if v is not None else "—"})
        st.dataframe(styled_cl, use_container_width=True, hide_index=True)
    else:
        st.info("Crypto loser data unavailable.")

st.markdown("---")

# ── Treasury Yield Curve ──────────────────────────────────────────────────────
st.markdown('<p class="section-header">U.S. Treasury Yield Curve</p>', unsafe_allow_html=True)
yields = fetch_treasury_yields()
if yields:
    MATURITIES = [
        ("1M", "month_1"),
        ("3M", "month_3"),
        ("6M", "month_6"),
        ("1Y", "year_1"),
        ("2Y", "year_2"),
        ("3Y", "year_3"),
        ("5Y", "year_5"),
        ("7Y", "year_7"),
        ("10Y", "year_10"),
        ("20Y", "year_20"),
        ("30Y", "year_30"),
    ]
    labels, values = [], []
    for label, attr in MATURITIES:
        v = getattr(yields, attr, None)
        if v is not None:
            labels.append(label)
            values.append(v)

    if labels:
        fig2 = go.Figure()
        fig2.add_trace(go.Scatter(
            x=labels,
            y=values,
            mode="lines+markers",
            line=dict(color="#A78BFA", width=2.5),
            marker=dict(color="#A78BFA", size=7),
            hovertemplate="<b>%{x}</b><br>Yield: %{y:.2f}%<extra></extra>",
        ))
        fig2.update_layout(
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
            margin=dict(l=0, r=0, t=10, b=0),
            height=260,
            xaxis=dict(showgrid=False, tickfont=dict(color="#64748B"), color="#64748B"),
            yaxis=dict(
                showgrid=True,
                gridcolor="#1E293B",
                tickfont=dict(color="#64748B"),
                color="#64748B",
                ticksuffix="%",
            ),
        )
        st.plotly_chart(fig2, use_container_width=True)

        date_label = getattr(yields, "date", "")
        st.caption(f"As of {date_label}")
else:
    st.info("Treasury yield data unavailable.")

st.markdown("---")
st.caption("Data via Massive API · Refreshes every 60s · ©2026 Market Overview Dashboard")

if st.button("🔄 Refresh"):
    st.cache_data.clear()
    st.rerun()
