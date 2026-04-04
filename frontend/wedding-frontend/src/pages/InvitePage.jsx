import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import api from "../api/client";

export default function InvitePage() {
    const { uuid } = useParams();
    const [invitation, setInvitation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchInvitation() {
            try {
                const response = await api.get(`/invitations/${uuid}/`);
                setInvitation(response.data);
            } catch (err) {
                console.error(err);

                if (err.response) {
                    setError(`Error ${err.response.status}: ${JSON.stringify(err.response.data)}`);
                } else if (err.request) {
                    setError("No response from backend. Check Django server and CORS.");
                } else {
                    setError(`Request error: ${err.message}`);
                }
            } finally {
                setLoading(false);
            }
        }

        fetchInvitation();
    }, [uuid]);

    if (loading) return <div style={styles.page}>Loading...</div>;
    if (error) return <div style={styles.page}>{error}</div>;

    const guest = invitation.guest;

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <p style={styles.kicker}>Wedding Invitation</p>
                <h1 style={styles.title}>Welcome, {guest.full_name}</h1>

                <p style={styles.text}>You are invited to celebrate with us.</p>
                <p style={styles.text}>Allowed guests: {guest.allowed_guests}</p>

                <div style={styles.qrBox}>
                    <QRCodeCanvas value={invitation.id} size={220} />
                </div>

                <p style={styles.uuid}>Invitation ID: {invitation.id}</p>

                <div style={styles.infoBox}>
                    <p>Date: 20 June 2026</p>
                    <p>Time: 7:00 PM</p>
                    <p>Venue: Cairo Palace Hotel</p>
                </div>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#efe7e1",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        fontFamily: "serif",
    },
    card: {
        maxWidth: "700px",
        width: "100%",
        background: "#fff8f3",
        borderRadius: "24px",
        padding: "40px",
        textAlign: "center",
    },
    kicker: {
        textTransform: "uppercase",
        letterSpacing: "4px",
        color: "#4f8a7a",
    },
    title: {
        color: "#4f8a7a",
        marginBottom: "12px",
    },
    text: {
        fontSize: "18px",
        color: "#444",
    },
    qrBox: {
        margin: "30px auto",
        background: "white",
        width: "fit-content",
        padding: "20px",
        borderRadius: "18px",
    },
    uuid: {
        fontSize: "12px",
        color: "#777",
        wordBreak: "break-all",
    },
    infoBox: {
        marginTop: "24px",
        fontSize: "18px",
        color: "#333",
    },
};