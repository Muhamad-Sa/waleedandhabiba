import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/client";
import "./ScanPage.css";

function formatScanTime(value) {
    if (!value) {
        return "Just now";
    }

    return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

export default function ScanPage() {
    const { uuid } = useParams();
    const [scanResult, setScanResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function scanInvitation() {
            if (!uuid) {
                setError("Missing invitation code.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError("");
                const response = await api.post(`/invitations/${uuid}/scan/`);
                setScanResult(response.data);
            } catch (scanError) {
                console.error("Failed to scan invitation", scanError);
                setScanResult(null);
                setError("We couldn't verify this invitation. Please try again or ask the couple for help.");
            } finally {
                setLoading(false);
            }
        }

        scanInvitation();
    }, [uuid]);

    const invitation = scanResult?.invitation;
    const guest = invitation?.guest;
    const isDuplicate = scanResult?.status === "already_checked_in";

    return (
        <main className="scan-page">
            <div className="scan-glow scan-glow-left" />
            <div className="scan-glow scan-glow-right" />

            <section className="scan-shell">
                <p className="scan-eyebrow">Wedding Check-In</p>

                {loading && (
                    <div className="scan-card scan-card-loading">
                        <div className="scan-spinner" />
                        <h1>Checking invitation…</h1>
                        <p>Please wait while we validate this QR code.</p>
                    </div>
                )}

                {!loading && error && (
                    <div className="scan-card scan-card-error">
                        <span className="scan-status-badge scan-status-badge-error">Unable to verify</span>
                        <h1>Invitation Not Found</h1>
                        <p>{error}</p>
                        <Link to="/" className="scan-link">
                            Return to homepage
                        </Link>
                    </div>
                )}

                {!loading && !error && invitation && guest && (
                    <div className={`scan-card ${isDuplicate ? "scan-card-duplicate" : "scan-card-success"}`}>
                        <span className={`scan-status-badge ${isDuplicate ? "scan-status-badge-duplicate" : "scan-status-badge-success"}`}>
                            {isDuplicate ? "Already Checked In" : "Entry Approved"}
                        </span>

                        <h1>{guest.full_name}</h1>
                        <p className="scan-message">{scanResult.message}</p>

                        <div className="scan-highlight">
                            <div>
                                <span className="scan-label">Allowed Guests</span>
                                <strong>{guest.allowed_guests}</strong>
                            </div>
                            <div>
                                <span className="scan-label">Scan Count</span>
                                <strong>{invitation.scanned_count}</strong>
                            </div>
                        </div>

                        <div className="scan-details">
                            <div className="scan-detail-row">
                                <span>Check-in status</span>
                                <span>{invitation.is_checked_in ? "Marked as scanned" : "Pending"}</span>
                            </div>
                            <div className="scan-detail-row">
                                <span>First scan</span>
                                <span>{formatScanTime(invitation.first_scanned_at)}</span>
                            </div>
                            <div className="scan-detail-row">
                                <span>Latest scan</span>
                                <span>{formatScanTime(invitation.last_scanned_at)}</span>
                            </div>
                        </div>

                        <p className="scan-footnote">
                            {isDuplicate
                                ? "This QR code has already been used. Please double-check with the host before allowing entry."
                                : "This invitation has now been marked as scanned for entrance check-in."}
                        </p>
                    </div>
                )}
            </section>
        </main>
    );
}
