import { useEffect, useMemo, useState } from "react";
import { Download, KeyRound, RefreshCw, Wand2 } from "lucide-react";
import api from "../api/client";
import "./QRAdminPage.css";

export default function QRAdminPage() {
    const [adminKey, setAdminKey] = useState("");
    const [codes, setCodes] = useState([]);
    const [summary, setSummary] = useState(null);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const totals = useMemo(() => {
        const scanned = codes.filter((code) => code.scan_count > 0).length;
        const scans = codes.reduce((total, code) => total + code.scan_count, 0);
        return { scanned, scans };
    }, [codes]);

    function adminHeaders() {
        return { headers: { "X-Admin-Key": adminKey } };
    }

    async function downloadCodesZip() {
        const response = await api.get("/qr/download", {
            ...adminHeaders(),
            responseType: "blob",
        });

        const blobUrl = window.URL.createObjectURL(response.data);
        const downloadLink = document.createElement("a");
        downloadLink.href = blobUrl;
        downloadLink.download = "waleed-habiba-qr-codes.zip";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        window.URL.revokeObjectURL(blobUrl);
    }

    async function loadCodes() {
        if (!adminKey) {
            setError("Enter the admin key first.");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const response = await api.get("/qr/all", adminHeaders());
            setCodes(response.data);
        } catch (loadError) {
            setError(loadError?.response?.data?.detail || "Could not load QR codes.");
        } finally {
            setIsLoading(false);
        }
    }

    async function generateCodes() {
        if (!adminKey) {
            setError("Enter the admin key first.");
            return;
        }

        setIsGenerating(true);
        setError("");
        setSummary(null);

        try {
            const response = await api.post("/qr/generate", {}, adminHeaders());
            setSummary(response.data);
            await loadCodes();
            await downloadCodesZip();
        } catch (generateError) {
            const detail = generateError?.response?.data?.detail;
            setError(detail || "Could not generate and download QR codes.");
        } finally {
            setIsGenerating(false);
        }
    }

    useEffect(() => {
        const savedKey = window.localStorage.getItem("wh_qr_admin_key") || "";
        setAdminKey(savedKey);
    }, []);

    useEffect(() => {
        if (adminKey) {
            window.localStorage.setItem("wh_qr_admin_key", adminKey);
        }
    }, [adminKey]);

    return (
        <main className="qr-admin-page">
            <section className="qr-admin-shell">
                <div className="qr-admin-heading">
                    <p>Waleed & Habiba</p>
                    <h1>QR Pass Dashboard</h1>
                </div>

                <section className="qr-admin-toolbar">
                    <label>
                        <KeyRound size={18} />
                        <input
                            type="password"
                            value={adminKey}
                            onChange={(event) => setAdminKey(event.target.value)}
                            placeholder="Admin key"
                        />
                    </label>

                    <button type="button" onClick={generateCodes} disabled={isGenerating}>
                        <Wand2 size={18} />
                        <span>{isGenerating ? "Generating" : "Generate & Download 400"}</span>
                    </button>

                    <button type="button" onClick={loadCodes} disabled={isLoading}>
                        <RefreshCw size={18} />
                        <span>{isLoading ? "Loading" : "Refresh"}</span>
                    </button>
                </section>

                {error && <p className="qr-admin-error">{error}</p>}
                {summary && (
                    <p className="qr-admin-summary">
                        Generated {summary.generated}, updated {summary.updated}, total {summary.total}.
                    </p>
                )}

                <section className="qr-admin-stats">
                    <div>
                        <span>Total passes</span>
                        <strong>{codes.length}</strong>
                    </div>
                    <div>
                        <span>Scanned passes</span>
                        <strong>{totals.scanned}</strong>
                    </div>
                    <div>
                        <span>Total scans</span>
                        <strong>{totals.scans}</strong>
                    </div>
                </section>

                <section className="qr-code-grid">
                    {codes.map((code) => (
                        <article key={code.id} className="qr-code-card">
                            <img src={code.image_url} alt={`Guest Pass #${code.code_number}`} />
                            <div>
                                <h2>Guest Pass #{code.code_number}</h2>
                                <p>{code.scan_count} scans</p>
                                <a href={code.image_url} target="_blank" rel="noreferrer">
                                    <Download size={16} />
                                    <span>Open PNG</span>
                                </a>
                            </div>
                        </article>
                    ))}
                </section>
            </section>
        </main>
    );
}
