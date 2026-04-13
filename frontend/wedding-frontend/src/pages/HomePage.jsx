import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import api from "../api/client";
import "./HomePage.css";

import laptopBg from "../../assets/laptop-bg.png";
import mobileBg from "../../assets/mobile-bg.png";

function MapPinIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    );
}

export default function HomePage() {
    const [searchParams] = useSearchParams();
    const inviteUuid = searchParams.get("invite");

    const [invitation, setInvitation] = useState(null);
    const [loadingInvitation, setLoadingInvitation] = useState(false);
    const [inviteError, setInviteError] = useState("");

    const mapsUrl = "https://maps.app.goo.gl/Mk5BAzDqCqheCNJL6";

    useEffect(() => {
        async function fetchInvitation() {
            if (!inviteUuid) {
                setInvitation(null);
                setInviteError("");
                return;
            }
            try {
                setLoadingInvitation(true);
                setInviteError("");
                const response = await api.get(`/invitations/${inviteUuid}/`);
                setInvitation(response.data);
            } catch (error) {
                console.error("Failed to load invitation", error);
                setInvitation(null);
                setInviteError("We couldn't find this personal invitation.");
            } finally {
                setLoadingInvitation(false);
            }
        }
        fetchInvitation();
    }, [inviteUuid]);

    return (
        <div className="home-page">

            {/* ── Loading ─────────────────────────────────────── */}
            {loadingInvitation && (
                <div className="invite-state-shell">
                    <div className="invite-state-card">
                        <div className="loading-spinner" />
                        <h2>Preparing your invitation…</h2>
                        <p>Just a moment, please</p>
                    </div>
                </div>
            )}

            {/* ── Error ───────────────────────────────────────── */}
            {inviteError && !loadingInvitation && (
                <div className="invite-state-shell">
                    <div className="invite-state-card">
                        <span className="invite-state-label">Invitation Notice</span>
                        <h2>Invitation Not Found</h2>
                        <p>{inviteError}</p>
                    </div>
                </div>
            )}

            {/* ── Invitation ──────────────────────────────────── */}
            {invitation && (
                <section className="personal-invite-section">

                    {/* ════════════════════════════════════════════
                        MOBILE  ≤ 900 px — mobile-bg.png
                        Layout mirrors the reference image:
                        skip decorative chandelier/wreath band → text →
                        empty center (QR) → date/venue below
                    ════════════════════════════════════════════ */}
                    <div
                        className="invite-mobile"
                        style={{ backgroundImage: `url(${mobileBg})` }}
                    >
                        <div className="mobile-content-wrap">

                            {/* "You're invited" */}
                            <p className="m-kicker">
                                You're invited to celebrate our wedding
                            </p>

                            {/* Couple names */}
                            <h1 className="m-couple-name" style={{
                                fontFamily: "var(--font-serif)",
                                fontStyle: "italic",
                                fontWeight: 600,
                                fontSize: "clamp(22px, 6.5vw, 32px)",
                                color: "var(--rose)",
                                textAlign: "center",
                                margin: "0 0 2px",
                                lineHeight: 1.2,
                                letterSpacing: "0.01em",
                            }}>
                                Waleed &amp; Habiba
                            </h1>

                            {/* QR code — center open area of the image */}
                            <div className="m-qr-zone">
                                <div className="m-qr-frame">
                                    <QRCodeCanvas
                                        value={invitation.id}
                                        size={150}
                                        bgColor="#ffffff"
                                        fgColor="#7b3f52"
                                        level="H"
                                        includeMargin={false}
                                    />
                                </div>
                                <p className="m-qr-note">Present at entrance</p>
                            </div>

                            {/* Date */}
                            <p className="m-date-line">Saturday • 27th June</p>

                            {/* Heart ornament */}
                            <p className="m-heart-ornament">꩜❡꩜</p>

                            {/* Venue */}
                            <p className="m-venue-line">Sofitel Down Town</p>
                            <p className="m-time-line">At 8:00 PM</p>

                            {/* Maps button */}
                            <a
                                href={mapsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inv-maps-btn"
                            >
                                <MapPinIcon />
                                Open Maps
                            </a>

                        </div>
                    </div>

                    {/* ════════════════════════════════════════════
                        DESKTOP  ≥ 901 px — laptop-bg.png
                        Same rose-brown palette, no glass cards,
                        QR column left · details column right
                    ════════════════════════════════════════════ */}
                    <div
                        className="invite-desktop"
                        style={{ backgroundImage: `url(${laptopBg})` }}
                    >
                        <div className="desktop-inner">

                            {/* QR column — left */}
                            <div className="d-col d-qr-col">
                                <p className="d-qr-kicker">
                                    Your personal invitation<br />
                                    &amp; entry QR code
                                </p>

                                <div className="d-monogram">W &amp; H</div>

                                <hr className="d-divider" />

                                <div className="d-qr-frame">
                                    <QRCodeCanvas
                                        value={invitation.id}
                                        size={160}
                                        bgColor="#ffffff"
                                        fgColor="#7b3f52"
                                        level="H"
                                        includeMargin={false}
                                    />
                                </div>

                                <p className="d-qr-note">Present this QR code at the entrance</p>
                            </div>

                            {/* Details column — right */}
                            <div className="d-col d-details-col">
                                <p className="d-kicker">
                                    You're invited to celebrate our wedding
                                </p>

                                <h1 className="d-couple-name">
                                    Waleed &amp; Habiba
                                </h1>

                                <hr className="d-divider" />

                                <div className="d-detail-group">
                                    <p className="d-detail-label">Date</p>
                                    <p className="d-detail-value">Saturday · 27th June</p>
                                    <p className="d-detail-sub">At 8:00 PM</p>
                                </div>

                                <div className="d-detail-group">
                                    <p className="d-detail-label">Venue</p>
                                    <p className="d-detail-value">Sofitel Downtown</p>
                                </div>

                                <div className="d-detail-group">
                                    <p className="d-detail-label">Allowed Guests</p>
                                    <div className="d-allowed-badge">
                                        {invitation.guest.allowed_guests}
                                    </div>
                                </div>

                                <a
                                    href={mapsUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inv-maps-btn"
                                >
                                    <MapPinIcon />
                                    Open Maps
                                </a>
                            </div>

                        </div>
                    </div>

                </section>
            )}
        </div>
    );
}