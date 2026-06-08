import os
import time
import streamlit as st
import plotly.graph_objects as go
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
    height: 100%;
}
.positive { color: #22C55E; }
.negative { color: #EF4444; }
.neutral  { color: #94A3B8; }
.market-open   { color: #22C55E; font-weight: 600; }
.market-closed { color: #EF4444; font-weight: 600; }
.section-header {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #64748B;
    margin-bottom: 0.6rem;
}
</style>
""", unsafe_allow_html=True)


@st.cache_resource
def get_client():
    return RESTClient(API_KEY)


def safe_aggs(ticker, days=30):
    """Fetch daily OHLC bars, return list of Agg objects."""
    try:
        today = datetime.now().strftime("%Y-%m-%d")
        from_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
        result = get_client().get_aggs(
            ticker=ticker,
            multiplier=1,
            timespan="day",
            from_=from_date,
            to=today,
            adjusted=True,
            sort="asc",
            limit=60,
        )
        return result if isinstance(result, list) else []
    except Exception:
        return []


@st.cache_data(ttl=60)
def fetch_market_status():
    try:
        return get_client().get_market_status()
    except Exception:
        return None


@st.cache_data(ttl=300)
def fetch_etf_bars():
    """Fetch 30-day OHLC for SPY, QQQ, DIA, IWM with small delays to avoid 429s."""
    result = {}
    tickers = [("SPY", "S&P 500"), ("QQQ", "Nasdaq 100"), ("DIA", "Dow Jones"), ("IWM", "Russell 2000")]
    for ticker, label in tickers:
        bars = safe_aggs(ticker, days=35)
        if bars:
            result[ticker] = {"label": label, "bars": bars}
        time.sleep(0.3)
    return result


@st.cache_data(ttl=300)
def fetch_crypto_bars():
    """Fetch 30-day OHLC for BTC and ETH."""
    result = {}
    pairs = [("X:BTCUSD", "Bitcoin"), ("X:ETHUSD", "Ethereum")]
    for ticker, label in pairs:
        bars = safe_aggs(ticker, days=35)
        if bars:
            result[ticker] = {"label": label, "bars": bars}
        time.sleep(0.3)
    return result


@st.cache_data(ttl=600)
def fetch_treasury_yields():
    """Fetch the most recent yield curve data point."""
    try:
        today = datetime.now().strftime("%Y-%m-%d")
        thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        gen = get_client().list_treasury_yields(
            date_gte=thirty_days_ago,
            date_lte=today,
            limit=30,
        )
        items = list(gen)
        if not items:
            return None, []
        # Sort descending by date and pick the most recent non-null entry
        items_sorted = sorted(items, key=lambda x: getattr(x, "date", ""), reverse=True)
        latest = items_sorted[0]
        return latest, items_sorted
    except Exception:
        return None, []


def fmt_pct(val):
    if val is None or not isinstance(val, (int, float)):
        return "—"
    sign = "+" if val >= 0 else ""
    return f"{sign}{val:.2f}%"


def fmt_price(val, prefix="$"):
    if val is None or isinstance(val, bool):
        return "—"
    try:
        f = float(val)
        return f"{prefix}{f:,.2f}"
    except (TypeError, ValueError):
        return "—"


def pct_change(bars):
    """Returns today's % change vs prev day close."""
    if not bars or len(bars) < 2:
        return None
    prev = getattr(bars[-2], "close", None)
    curr = getattr(bars[-1], "close", None)
    if prev and curr and prev != 0:
        return (curr - prev) / prev * 100
    return None


def bars_to_df(bars):
    rows = []
    for b in bars:
        t_ms = getattr(b, "timestamp", None)
        c = getattr(b, "close", None)
        if t_ms and c is not None:
            rows.append({
                "date": datetime.fromtimestamp(t_ms / 1000).strftime("%b %d"),
                "close": c,
            })
    return pd.DataFrame(rows)


def spark_chart(df, color="#3B82F6", height=120):
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=df["date"],
        y=df["close"],
        mode="lines",
        fill="tozeroy",
        line=dict(color=color, width=1.5),
        fillcolor=f"rgba({int(color[1:3],16)},{int(color[3:5],16)},{int(color[5:7],16)},0.1)",
        hovertemplate="<b>%{x}</b><br>%{y:,.2f}<extra></extra>",
    ))
    fig.update_layout(
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        margin=dict(l=0, r=0, t=4, b=0),
        height=height,
        xaxis=dict(showgrid=False, showticklabels=False, zeroline=False),
        yaxis=dict(showgrid=False, showticklabels=False, zeroline=False),
    )
    return fig


# ── Header ──────────────────────────────────────────────────────────────────
col_title, col_time = st.columns([3, 1])
with col_title:
    st.title("📈 Market Overview")
with col_time:
    now = datetime.now().strftime("%b %d, %Y  %I:%M %p")
    st.markdown(
        f"<p style='text-align:right;color:#64748B;padding-top:1.5rem;font-size:0.85rem;'>{now}</p>",
        unsafe_allow_html=True,
    )

# ── Market Status ────────────────────────────────────────────────────────────
status = fetch_market_status()
if status:
    st.markdown('<p class="section-header">Market Status</p>', unsafe_allow_html=True)
    scols = st.columns(5)

    def ms(obj, attr):
        if obj is None:
            return "—"
        v = (obj.get(attr) if isinstance(obj, dict) else getattr(obj, attr, None))
        return str(v).title() if v else "—"

    exchanges = getattr(status, "exchanges", None)
    currencies = getattr(status, "currencies", None)

    markets = [
        ("NYSE",   ms(exchanges, "nyse")),
        ("NASDAQ", ms(exchanges, "nasdaq")),
        ("OTC",    ms(exchanges, "otc")),
        ("Crypto", ms(currencies, "crypto")),
        ("Forex",  ms(currencies, "fx")),
    ]
    for col, (name, mstatus) in zip(scols, markets):
        css = "market-open" if mstatus.lower() == "open" else "market-closed"
        col.markdown(f"""
        <div class="metric-card">
            <div class="section-header">{name}</div>
            <div class="{css}" style="font-size:1.05rem;">{mstatus}</div>
        </div>
        """, unsafe_allow_html=True)
    st.markdown("")

st.markdown("---")

# ── ETF Proxies (Major Indices) ───────────────────────────────────────────────
st.markdown('<p class="section-header">Major Markets — 30-Day Performance</p>', unsafe_allow_html=True)

etf_data = fetch_etf_bars()
if etf_data:
    etf_cols = st.columns(len(etf_data))
    COLORS = ["#3B82F6", "#8B5CF6", "#06B6D4", "#F59E0B"]
    for col, ((ticker, info), color) in zip(etf_cols, zip(etf_data.items(), COLORS)):
        bars = info["bars"]
        label = info["label"]
        latest_close = getattr(bars[-1], "close", None) if bars else None
        chg = pct_change(bars)
        arrow = "▲" if (chg or 0) >= 0 else "▼"
        css = "positive" if (chg or 0) >= 0 else "negative"
        df = bars_to_df(bars)
        with col:
            st.markdown(f"""
            <div class="metric-card">
                <div class="section-header">{label} ({ticker})</div>
                <div style="font-size:1.4rem;font-weight:700;">{fmt_price(latest_close)}</div>
                <div class="{css}" style="font-size:0.85rem;">{arrow} {fmt_pct(chg)} today</div>
            </div>
            """, unsafe_allow_html=True)
            if not df.empty:
                st.plotly_chart(spark_chart(df, color=color), use_container_width=True)
else:
    st.info("ETF price data unavailable.")

st.markdown("---")

# ── Full SPY Chart ────────────────────────────────────────────────────────────
st.markdown('<p class="section-header">S&P 500 (SPY) — 30-Day Chart</p>', unsafe_allow_html=True)
spy_data = etf_data.get("SPY", {})
spy_bars = spy_data.get("bars", [])
if spy_bars:
    df_spy = bars_to_df(spy_bars)
    if not df_spy.empty:
        fig_spy = go.Figure()
        fig_spy.add_trace(go.Scatter(
            x=df_spy["date"],
            y=df_spy["close"],
            mode="lines",
            fill="tozeroy",
            line=dict(color="#3B82F6", width=2),
            fillcolor="rgba(59,130,246,0.1)",
            hovertemplate="<b>%{x}</b><br>Close: $%{y:,.2f}<extra></extra>",
        ))
        fig_spy.update_layout(
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
            margin=dict(l=0, r=0, t=10, b=0),
            height=280,
            xaxis=dict(showgrid=False, tickfont=dict(color="#64748B"), color="#64748B"),
            yaxis=dict(showgrid=True, gridcolor="#1E293B", tickfont=dict(color="#64748B"), color="#64748B"),
        )
        st.plotly_chart(fig_spy, use_container_width=True)

st.markdown("---")

# ── Crypto ────────────────────────────────────────────────────────────────────
st.markdown('<p class="section-header">Crypto — BTC & ETH</p>', unsafe_allow_html=True)
crypto_data = fetch_crypto_bars()

if crypto_data:
    c_cols = st.columns(2)
    crypto_colors = ["#F59E0B", "#6366F1"]
    for col, ((ticker, info), color) in zip(c_cols, zip(crypto_data.items(), crypto_colors)):
        bars = info["bars"]
        label = info["label"]
        latest_close = getattr(bars[-1], "close", None) if bars else None
        chg = pct_change(bars)
        arrow = "▲" if (chg or 0) >= 0 else "▼"
        css = "positive" if (chg or 0) >= 0 else "negative"
        df = bars_to_df(bars)
        with col:
            st.markdown(f"""
            <div class="metric-card">
                <div class="section-header">{label}</div>
                <div style="font-size:1.4rem;font-weight:700;">{fmt_price(latest_close)}</div>
                <div class="{css}" style="font-size:0.85rem;">{arrow} {fmt_pct(chg)} today</div>
            </div>
            """, unsafe_allow_html=True)
            if not df.empty:
                fig_c = go.Figure()
                fig_c.add_trace(go.Scatter(
                    x=df["date"],
                    y=df["close"],
                    mode="lines",
                    fill="tozeroy",
                    line=dict(color=color, width=2),
                    fillcolor=f"rgba({int(color[1:3],16)},{int(color[3:5],16)},{int(color[5:7],16)},0.1)",
                    hovertemplate="<b>%{x}</b><br>$%{y:,.2f}<extra></extra>",
                ))
                fig_c.update_layout(
                    paper_bgcolor="rgba(0,0,0,0)",
                    plot_bgcolor="rgba(0,0,0,0)",
                    margin=dict(l=0, r=0, t=10, b=0),
                    height=220,
                    xaxis=dict(showgrid=False, tickfont=dict(color="#64748B"), color="#64748B"),
                    yaxis=dict(showgrid=True, gridcolor="#1E293B", tickfont=dict(color="#64748B"), color="#64748B"),
                )
                st.plotly_chart(fig_c, use_container_width=True)
else:
    st.info("Crypto data unavailable.")

st.markdown("---")

# ── Treasury Yield Curve ──────────────────────────────────────────────────────
st.markdown('<p class="section-header">U.S. Treasury Yield Curve</p>', unsafe_allow_html=True)
latest_yield, all_yields = fetch_treasury_yields()

if latest_yield:
    MATURITIES = [
        ("1M",  "yield_1_month"),
        ("3M",  "yield_3_month"),
        ("6M",  "yield_6_month"),
        ("1Y",  "yield_1_year"),
        ("2Y",  "yield_2_year"),
        ("3Y",  "yield_3_year"),
        ("5Y",  "yield_5_year"),
        ("7Y",  "yield_7_year"),
        ("10Y", "yield_10_year"),
        ("20Y", "yield_20_year"),
        ("30Y", "yield_30_year"),
    ]

    # Build yield curve
    labels, values = [], []
    for label, attr in MATURITIES:
        v = getattr(latest_yield, attr, None)
        if v is not None:
            labels.append(label)
            values.append(v)

    yc_col, hist_col = st.columns([1, 1])

    with yc_col:
        st.markdown(f"**Yield Curve** — as of {getattr(latest_yield, 'date', '')}")
        if labels:
            fig_yc = go.Figure()
            fig_yc.add_trace(go.Scatter(
                x=labels, y=values,
                mode="lines+markers",
                line=dict(color="#A78BFA", width=2.5),
                marker=dict(color="#A78BFA", size=7),
                hovertemplate="<b>%{x}</b><br>%{y:.2f}%<extra></extra>",
            ))
            fig_yc.update_layout(
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                margin=dict(l=0, r=0, t=10, b=0),
                height=280,
                xaxis=dict(showgrid=False, tickfont=dict(color="#64748B"), color="#64748B"),
                yaxis=dict(
                    showgrid=True, gridcolor="#1E293B",
                    tickfont=dict(color="#64748B"), color="#64748B",
                    ticksuffix="%",
                ),
            )
            st.plotly_chart(fig_yc, use_container_width=True)

    with hist_col:
        st.markdown("**10-Year Yield — 30-Day History**")
        if all_yields:
            yield_rows = []
            for y in reversed(all_yields):
                d = getattr(y, "date", None)
                v10 = getattr(y, "yield_10_year", None)
                if d and v10 is not None:
                    yield_rows.append({"date": d, "yield": v10})
            if yield_rows:
                df_y = pd.DataFrame(yield_rows)
                fig_y10 = go.Figure()
                fig_y10.add_trace(go.Scatter(
                    x=df_y["date"], y=df_y["yield"],
                    mode="lines+markers",
                    line=dict(color="#34D399", width=2),
                    marker=dict(color="#34D399", size=4),
                    hovertemplate="<b>%{x}</b><br>%{y:.2f}%<extra></extra>",
                ))
                fig_y10.update_layout(
                    paper_bgcolor="rgba(0,0,0,0)",
                    plot_bgcolor="rgba(0,0,0,0)",
                    margin=dict(l=0, r=0, t=10, b=0),
                    height=280,
                    xaxis=dict(showgrid=False, tickfont=dict(color="#64748B"), color="#64748B"),
                    yaxis=dict(
                        showgrid=True, gridcolor="#1E293B",
                        tickfont=dict(color="#64748B"), color="#64748B",
                        ticksuffix="%",
                    ),
                )
                st.plotly_chart(fig_y10, use_container_width=True)
else:
    st.info("Treasury yield data unavailable.")

st.markdown("---")
st.caption("Data via Massive API (massive.com) · Prices are end-of-day · ©2026 Market Overview Dashboard")

col_r, col_note = st.columns([1, 4])
with col_r:
    if st.button("🔄 Refresh Data"):
        st.cache_data.clear()
        st.rerun()
with col_note:
    st.markdown("<span style='color:#64748B;font-size:0.8rem;'>Snapshots & movers require an upgraded Massive plan.</span>", unsafe_allow_html=True)
