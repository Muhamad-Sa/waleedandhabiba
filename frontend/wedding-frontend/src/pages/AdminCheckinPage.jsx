import { useState } from "react";
import api from "../api/client";

export default function AdminCheckinPage() {
    const [uuid, setUuid] = useState("");
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");

    async function handleScan() {
        setError("");
        setResult(null);

        try {
            const response = await api.post(`/invitations/${uuid}/scan/`);
            setResult(response.data);
        } catch (err) {
            setError("QR not found or invalid.");
        }
    }

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <h1 style={styles.title}>Admin Check-in</h1>

                <input
                    type="text"
                    placeholder="Paste invitation UUID"
                    value={uuid}
                    onChange={(e) => setUuid(e.target.value)}
                    style={styles.input}
                />

                <button onClick={handleScan} style={styles.button}>
                    Check In
                </button>

                {error && <p style={styles.error}>{error}</p>}

                {result && (
                    <div style={styles.resultBox}>
                        <p>Status: {result.status}</p>
                        <p>Message: {result.message}</p>
                        <p>Name: {result.invitation.guest.full_name}</p>
                        <p>Allowed Guests: {result.invitation.guest.allowed_guests}</p>
                        <p>Scanned Count: {result.invitation.scanned_count}</p>
                        <p>Checked In: {result.invitation.is_checked_in ? "Yes" : "No"}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#efe7e1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
    },
    card: {
        width: "100%",
        maxWidth: "600px",
        background: "#fff8f3",
        borderRadius: "20px",
        padding: "30px",
    },
    title: {
        marginBottom: "20px",
        color: "#4f8a7a",
    },
    input: {
        width: "100%",
        padding: "14px",
        fontSize: "16px",
        marginBottom: "14px",
        borderRadius: "12px",
        border: "1px solid #ccc",
    },
    button: {
        width: "100%",
        padding: "14px",
        fontSize: "16px",
        borderRadius: "12px",
        border: "none",
        background: "#f2755a",
        color: "white",
        cursor: "pointer",
    },
    error: {
        color: "red",
        marginTop: "16px",
    },
    resultBox: {
        marginTop: "20px",
        padding: "20px",
        background: "#fff",
        borderRadius: "16px",
    },
};