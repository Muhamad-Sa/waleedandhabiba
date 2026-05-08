import { useMemo, useState } from "react";
import api from "../api/client";
import InvitationQRCode from "../components/InvitationQRCode";
import "./InvitationGeneratorPage.css";

export default function InvitationGeneratorPage() {
    const [createdGuest, setCreatedGuest] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    const invitationLink = useMemo(() => {
        if (!createdGuest?.invitation_qr?.id) {
            return "";
        }

        return `${window.location.origin}/?invite=${createdGuest.invitation_qr.id}`;
    }, [createdGuest]);

    async function handleGenerate() {
        setIsSubmitting(true);
        setError("");
        setCopied(false);

        try {
            const response = await api.post("/guests/", {});
            setCreatedGuest(response.data);
        } catch (submitError) {
            console.error("Failed to create invitation", submitError);
            setError("We couldn't generate a new invitation right now. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleCopyLink() {
        if (!invitationLink) {
            return;
        }

        try {
            await navigator.clipboard.writeText(invitationLink);
            setCopied(true);
        } catch {
            setCopied(false);
            setError("Copy failed on this browser. You can still copy the link manually.");
        }
    }

    return (
        <main className="generator-page">
            <div className="generator-page__glow generator-page__glow--left" />
            <div className="generator-page__glow generator-page__glow--right" />

            <section className="generator-shell">
                <div className="generator-hero">
                    <p className="generator-hero__eyebrow">Invitation Studio</p>
                    <h1 className="generator-hero__title">Generate a new invitation instantly</h1>
                    <p className="generator-hero__text">
                        No guest names or manual fields. Press generate and the system will create a
                        fresh invitation UUID with its private usher QR code.
                    </p>
                </div>

                <div className="generator-layout">
                    <div className="generator-card generator-form generator-form--compact">
                        <div className="generator-card__header">
                            <p className="generator-card__eyebrow">Quick Generate</p>
                            <h2 className="generator-card__title">One-click invitation</h2>
                        </div>

                        <p className="generator-form__text">
                            The system will generate a new invitation record and track only the
                            invitation UUID, short QR code, and scan count.
                        </p>

                        {error && <p className="generator-error">{error}</p>}

                        <button
                            className="generator-button"
                            type="button"
                            disabled={isSubmitting}
                            onClick={handleGenerate}
                        >
                            {isSubmitting ? "Generating..." : "Generate Invitation"}
                        </button>
                    </div>

                    <div className="generator-card generator-preview">
                        <div className="generator-card__header">
                            <p className="generator-card__eyebrow">Generated Result</p>
                            <h2 className="generator-card__title">Invitation preview</h2>
                        </div>

                        {!createdGuest?.invitation_qr && (
                            <div className="generator-empty">
                                <p>Your newest invitation will appear here.</p>
                                <span>
                                    Press the button once and you will get the personal invite link,
                                    QR code, invitation UUID, and short usher code.
                                </span>
                            </div>
                        )}

                        {createdGuest?.invitation_qr && (
                            <div className="generator-result">
                                <p className="generator-result__name">Invitation Ready</p>
                                <p className="generator-result__meta">
                                    UUID: {createdGuest.invitation_qr.id}
                                </p>

                                <InvitationQRCode
                                    value={createdGuest.invitation_qr.short_code}
                                    size={210}
                                    label="Private invitation"
                                    note={`Usher code: ${createdGuest.invitation_qr.short_code}`}
                                    className="generator-result__qr"
                                />

                                <div className="generator-link-block">
                                    <span>Invite link</span>
                                    <code>{invitationLink}</code>
                                </div>

                                <div className="generator-link-block">
                                    <span>Short QR code</span>
                                    <code>{createdGuest.invitation_qr.short_code}</code>
                                </div>

                                <div className="generator-actions">
                                    <button
                                        type="button"
                                        className="generator-button generator-button--secondary"
                                        onClick={handleCopyLink}
                                    >
                                        {copied ? "Link Copied" : "Copy Invite Link"}
                                    </button>
                                    <a
                                        href={invitationLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="generator-link"
                                    >
                                        Open Invitation
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}
