import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import api from "../api/client";
import "./AdminCheckinPage.css";

const SCANNER_REGION_ID = "usher-qr-reader";
const UUID_PATTERN =
    /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

function extractInvitationUuid(value) {
    if (!value) {
        return "";
    }

    const match = value.match(UUID_PATTERN);
    return match ? match[0] : "";
}

export default function AdminCheckinPage() {
    const scannerRef = useRef(null);
    const scannedLockRef = useRef(false);

    const [manualValue, setManualValue] = useState("");
    const [isScannerReady, setIsScannerReady] = useState(false);
    const [scannerActive, setScannerActive] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function stopScanner() {
        if (!scannerRef.current) {
            return;
        }

        try {
            await scannerRef.current.stop();
        } catch {
            // Ignore stop errors when the scanner is not actively running.
        }

        try {
            await scannerRef.current.clear();
        } catch {
            // Ignore clear errors if the reader is already detached.
        }

        scannerRef.current = null;
        setScannerActive(false);
        scannedLockRef.current = false;
    }

    async function submitScan(rawValue) {
        const uuid = extractInvitationUuid(rawValue);

        if (!uuid) {
            setError("No valid invitation code was found in that scan.");
            return;
        }

        setIsSubmitting(true);
        setError("");
        setResult(null);
        setManualValue(uuid);

        try {
            const response = await api.post(`/invitations/${uuid}/scan/`);
            setResult(response.data);
        } catch {
            setError("QR not found or invalid.");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function startScanner() {
        setError("");

        if (scannerRef.current || scannerActive) {
            return;
        }

        const scanner = new Html5Qrcode(SCANNER_REGION_ID);
        scannerRef.current = scanner;

        try {
            await scanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 240, height: 240 },
                    aspectRatio: 1,
                },
                async (decodedText) => {
                    if (scannedLockRef.current) {
                        return;
                    }

                    scannedLockRef.current = true;
                    await stopScanner();
                    await submitScan(decodedText);
                },
                () => {
                    // Ignore frame-by-frame decode misses.
                },
            );

            setScannerActive(true);
            setIsScannerReady(true);
        } catch {
            scannerRef.current = null;
            setScannerActive(false);
            setIsScannerReady(false);
            setError("Camera access was blocked or not available on this device.");
        }
    }

    async function handleManualSubmit(event) {
        event.preventDefault();
        await submitScan(manualValue);
    }

    useEffect(() => {
        setIsScannerReady(typeof navigator !== "undefined" && !!navigator.mediaDevices);
        return () => {
            stopScanner();
        };
    }, []);

    const guest = result?.invitation?.guest;
    const isDuplicate = result?.status === "already_checked_in";

    return (
        <main className="scanner-page">
            <div className="scanner-page__glow scanner-page__glow--left" />
            <div className="scanner-page__glow scanner-page__glow--right" />

            <section className="scanner-shell">
                <div className="scanner-intro">
                    <p className="scanner-intro__eyebrow">Usher Access</p>
                    <h1 className="scanner-intro__title">Entrance Scanner</h1>
                    <p className="scanner-intro__text">
                        Open this page on the usher&apos;s phone, allow camera access, and scan each
                        invitation QR code to mark it as used.
                    </p>
                </div>

                <div className="scanner-layout">
                    <div className="scanner-card">
                        <div className="scanner-card__header">
                            <div>
                                <p className="scanner-card__eyebrow">Live Camera</p>
                                <h2 className="scanner-card__title">Scan invitation QR</h2>
                            </div>

                            <button
                                type="button"
                                className={`scanner-button ${scannerActive ? "scanner-button--soft" : ""}`}
                                onClick={scannerActive ? stopScanner : startScanner}
                            >
                                {scannerActive ? "Stop Camera" : "Start Camera"}
                            </button>
                        </div>

                        <div className="scanner-reader-shell">
                            <div id={SCANNER_REGION_ID} className="scanner-reader" />
                            {!scannerActive && (
                                <div className="scanner-reader__placeholder">
                                    <span>Camera preview appears here</span>
                                    <p>
                                        {isScannerReady
                                            ? "Tap Start Camera to begin scanning."
                                            : "This browser does not expose camera access."}
                                    </p>
                                </div>
                            )}
                        </div>

                        <form className="scanner-manual-form" onSubmit={handleManualSubmit}>
                            <label className="scanner-input-group">
                                <span>Manual fallback</span>
                                <input
                                    type="text"
                                    placeholder="Paste a full scan URL or invitation UUID"
                                    value={manualValue}
                                    onChange={(event) => setManualValue(event.target.value)}
                                />
                            </label>

                            <button
                                type="submit"
                                className="scanner-button"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Checking..." : "Submit Code"}
                            </button>
                        </form>
                    </div>

                    <div className="scanner-card scanner-card--result">
                        <p className="scanner-card__eyebrow">Scan Result</p>
                        <h2 className="scanner-card__title">Guest status</h2>

                        {error && <p className="scanner-error">{error}</p>}

                        {!error && !result && (
                            <div className="scanner-empty-state">
                                <p>Ready for the next guest.</p>
                                <span>The result will appear here after a successful scan.</span>
                            </div>
                        )}

                        {result && guest && (
                            <div className={`scanner-result ${isDuplicate ? "scanner-result--duplicate" : "scanner-result--success"}`}>
                                <span className="scanner-result__badge">
                                    {isDuplicate ? "Already Checked In" : "Approved"}
                                </span>

                                <h3>{guest.full_name}</h3>
                                <p className="scanner-result__message">{result.message}</p>

                                <div className="scanner-result__grid">
                                    <div>
                                        <span>Allowed Guests</span>
                                        <strong>{guest.allowed_guests}</strong>
                                    </div>
                                    <div>
                                        <span>Scan Count</span>
                                        <strong>{result.invitation.scanned_count}</strong>
                                    </div>
                                </div>

                                <p className="scanner-result__footnote">
                                    {isDuplicate
                                        ? "This invitation has already been used. Please confirm with the couple before entry."
                                        : "This invitation is now marked as scanned in the system."}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}
