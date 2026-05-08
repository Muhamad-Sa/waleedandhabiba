import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff, CheckCircle2, RefreshCw, ShieldAlert } from "lucide-react";
import api from "../api/client";
import "./ScanPage.css";

const SCANNER_REGION_ID = "wedding-pass-reader";
const TOKEN_PATTERN = /wh-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[0-9a-f]{64}/i;

function extractToken(value) {
    const match = String(value || "").trim().match(TOKEN_PATTERN);
    return match ? match[0] : "";
}

function formatDateTime(value) {
    if (!value) {
        return "Not scanned yet";
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

export default function ScanPage() {
    const scannerRef = useRef(null);
    const scanLockRef = useRef(false);

    const [cameraActive, setCameraActive] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [manualToken, setManualToken] = useState("");
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function stopCamera() {
        if (!scannerRef.current) {
            return;
        }

        try {
            await scannerRef.current.stop();
        } catch {
            // The scanner may already be stopped after a successful decode.
        }

        try {
            await scannerRef.current.clear();
        } catch {
            // The reader can already be detached during route cleanup.
        }

        scannerRef.current = null;
        scanLockRef.current = false;
        setCameraActive(false);
    }

    async function submitToken(rawValue) {
        const token = extractToken(rawValue);

        if (!token) {
            setError("This QR code is not a Waleed & Habiba signed wedding pass.");
            setResult(null);
            return;
        }

        setIsSubmitting(true);
        setError("");
        setResult(null);
        setManualToken(token);

        try {
            const response = await api.post("/qr/scan", { token });
            setResult(response.data);
        } catch (submitError) {
            const detail = submitError?.response?.data?.detail;
            setError(detail || "This wedding pass could not be verified.");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function startCamera() {
        setError("");

        if (cameraActive || scannerRef.current) {
            return;
        }

        const scanner = new Html5Qrcode(SCANNER_REGION_ID);
        scannerRef.current = scanner;

        try {
            await scanner.start(
                { facingMode: "environment" },
                {
                    fps: 12,
                    qrbox: { width: 260, height: 260 },
                    aspectRatio: 1,
                },
                async (decodedText) => {
                    if (scanLockRef.current) {
                        return;
                    }

                    scanLockRef.current = true;
                    await stopCamera();
                    await submitToken(decodedText);
                },
                () => {},
            );

            setCameraActive(true);
            setCameraReady(true);
        } catch {
            scannerRef.current = null;
            setCameraActive(false);
            setCameraReady(false);
            setError("Camera access was blocked or is unavailable on this device.");
        }
    }

    async function handleManualSubmit(event) {
        event.preventDefault();
        await submitToken(manualToken);
    }

    useEffect(() => {
        setCameraReady(typeof navigator !== "undefined" && !!navigator.mediaDevices);
        return () => {
            stopCamera();
        };
    }, []);

    const firstTime = result?.status === "first_time";
    const scan = result?.scan;

    return (
        <main className="pass-scan-page">
            <section className="pass-scan-shell">
                <div className="pass-scan-heading">
                    <p className="pass-scan-kicker">Waleed & Habiba</p>
                    <h1>Wedding Pass Scanner</h1>
                </div>

                <div className="pass-scan-grid">
                    <section className="pass-panel pass-panel--camera">
                        <div className="pass-panel__header">
                            <div>
                                <p className="pass-panel__kicker">Live Camera</p>
                                <h2>Scan QR pass</h2>
                            </div>

                            <button
                                type="button"
                                className="pass-icon-button"
                                onClick={cameraActive ? stopCamera : startCamera}
                                aria-label={cameraActive ? "Stop camera" : "Start camera"}
                                title={cameraActive ? "Stop camera" : "Start camera"}
                            >
                                {cameraActive ? <CameraOff size={20} /> : <Camera size={20} />}
                            </button>
                        </div>

                        <div className="pass-camera-frame">
                            <div id={SCANNER_REGION_ID} className="pass-camera-reader" />
                            {!cameraActive && (
                                <div className="pass-camera-placeholder">
                                    <Camera size={38} />
                                    <span>{cameraReady ? "Ready to scan" : "Camera unavailable"}</span>
                                </div>
                            )}
                        </div>

                        <form className="pass-manual" onSubmit={handleManualSubmit}>
                            <label>
                                <span>Signed token fallback</span>
                                <input
                                    value={manualToken}
                                    onChange={(event) => setManualToken(event.target.value)}
                                    placeholder="wh-uuid-signature"
                                    autoComplete="off"
                                />
                            </label>

                            <button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <RefreshCw size={18} /> : <CheckCircle2 size={18} />}
                                <span>{isSubmitting ? "Checking" : "Verify"}</span>
                            </button>
                        </form>
                    </section>

                    <section className="pass-panel pass-panel--result">
                        <p className="pass-panel__kicker">Scan Result</p>
                        <h2>{result ? result.qr_code.label : "Awaiting pass"}</h2>

                        {error && (
                            <div className="pass-alert">
                                <ShieldAlert size={20} />
                                <span>{error}</span>
                            </div>
                        )}

                        {!error && !result && (
                            <div className="pass-empty">
                                <span>No pass scanned yet.</span>
                            </div>
                        )}

                        {result && (
                            <div className={`pass-result ${firstTime ? "pass-result--first" : "pass-result--repeat"}`}>
                                <span className="pass-status-badge">
                                    <span className="pass-status-dot" />
                                    {firstTime ? "FIRST TIME" : "ALREADY SCANNED"}
                                </span>

                                <dl className="pass-history">
                                    <div>
                                        <dt>Previous scans</dt>
                                        <dd>{scan.previous_scan_count}</dd>
                                    </div>
                                    <div>
                                        <dt>Total scans</dt>
                                        <dd>{scan.total_scans}</dd>
                                    </div>
                                    <div>
                                        <dt>First scan</dt>
                                        <dd>{formatDateTime(scan.first_scanned_at)}</dd>
                                    </div>
                                    <div>
                                        <dt>Most recent scan</dt>
                                        <dd>{formatDateTime(scan.last_scanned_at)}</dd>
                                    </div>
                                </dl>
                            </div>
                        )}
                    </section>
                </div>
            </section>
        </main>
    );
}
