import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import api from "../api/client";
import "./HomePage.css";

export default function HomePage() {
    const [searchParams] = useSearchParams();
    const inviteUuid = searchParams.get("invite");

    const [invitation, setInvitation] = useState(null);
    const [loadingInvitation, setLoadingInvitation] = useState(false);
    const [inviteError, setInviteError] = useState("");

    const mapsUrl = "https://maps.app.goo.gl/Mk5BAzDqCqheCNJL6"
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
                setInviteError("We couldn’t find this personal invitation.");
            } finally {
                setLoadingInvitation(false);
            }
        }

        fetchInvitation();
    }, [inviteUuid]);

    return (
        <div className="home-page">
            {loadingInvitation && (
                <section className="personal-invite-section">
                    <div className="fancy-invite-stage fancy-invite-stage-loading">
                        <div className="fancy-invite-large-card">
                            <h2 className="fancy-large-couple">Loading your invitation...</h2>
                        </div>
                    </div>
                </section>
            )}

            {inviteError && (
                <section className="personal-invite-section">
                    <div className="fancy-invite-stage fancy-invite-stage-loading">
                        <div className="fancy-invite-large-card">
                            <p className="fancy-label">Invitation Notice</p>
                            <h2 className="fancy-large-couple">Invitation not found</h2>
                            <p className="fancy-subvalue">{inviteError}</p>
                        </div>
                    </div>
                </section>
            )}

            {invitation && (
                <section className="personal-invite-section">
                    <div className="fancy-invite-stage">
                        <div className="fancy-invite-large-card">
                            <div className="fancy-large-topnote">
                                You are warmly welcome to witness
                                <br />
                                and celebrate the wedding of
                            </div>

                            <h2 className="fancy-large-couple">WALEED & HABIBA</h2>

                            <div className="fancy-large-divider" />

                            <div className="fancy-large-block">
                                <p className="fancy-label">Honored Guest</p>
                                <p className="fancy-value fancy-guest-name">
                                    {invitation.guest.full_name}
                                </p>
                            </div>

                            <div className="fancy-large-block">
                                <p className="fancy-label">On Saturday</p>
                                <p className="fancy-value">June 27, 2026</p>
                                <p className="fancy-value">at 8:00 PM</p>
                            </div>

                            <div className="fancy-large-block">
                                <p className="fancy-label">At</p>
                                <p className="fancy-value">Sofitel down town</p>
                            </div>

                            <div className="fancy-large-block">
                                <p className="fancy-label">Allowed Guests</p>
                                <p className="fancy-value">
                                    {invitation.guest.allowed_guests}
                                </p>
                            </div>

                            <a
                                href={mapsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="fancy-maps-link"
                            >
                                Open Maps
                            </a>
                        </div>

                        <div className="fancy-invite-small-card">
                            <p className="fancy-small-kicker">
                                Find your personal invitation
                                <br />
                                and entry QR code here
                            </p>

                            <div className="fancy-small-monogram">W&nbsp; & &nbsp;H</div>

                            <div className="fancy-small-guest-meta">
                                <p>{invitation.guest.full_name}</p>
                                <p>
                                    {invitation.guest.allowed_guests} guest
                                    {invitation.guest.allowed_guests > 1 ? "s" : ""} allowed
                                </p>
                            </div>

                            <div className="fancy-small-qr-frame">
                                <QRCodeCanvas
                                    value={invitation.id}
                                    size={170}
                                    bgColor="#ffffff"
                                    fgColor="#b9ae8e"
                                    level="H"
                                    includeMargin={true}
                                />
                            </div>

                            <p className="fancy-small-note">
                                Please present this QR code at the entrance
                            </p>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}