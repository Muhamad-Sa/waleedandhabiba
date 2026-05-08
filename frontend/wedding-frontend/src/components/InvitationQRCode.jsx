/* eslint-disable react/prop-types */
import { QRCodeSVG } from "qrcode.react";
import "./InvitationQRCode.css";

const monogramSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <rect x="0" y="0" width="96" height="96" rx="48" fill="#fff9f4"/>
  <circle cx="48" cy="48" r="45" fill="none" stroke="#d9c3b1" stroke-width="2"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
        font-family="Cormorant Garamond, Georgia, serif" font-size="30"
        font-style="italic" fill="#7b3f52">W&amp;H</text>
</svg>
`;

const monogramDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(monogramSvg)}`;

export default function InvitationQRCode({
    value,
    size = 180,
    note = "Entrance code",
    label = "Private QR",
    className = "",
}) {
    return (
        <div className={`invitation-qr-shell ${className}`.trim()}>
            <span className="invitation-qr-label">{label}</span>
            <div className="invitation-qr-card">
                <div className="invitation-qr-card__inner">
                    <QRCodeSVG
                        value={value}
                        size={size}
                        bgColor="#fffaf5"
                        fgColor="#7b3f52"
                        level="H"
                        includeMargin={false}
                        imageSettings={{
                            src: monogramDataUrl,
                            height: Math.round(size * 0.25),
                            width: Math.round(size * 0.25),
                            excavate: true,
                        }}
                    />
                </div>
            </div>
            <p className="invitation-qr-note">{note}</p>
        </div>
    );
}
