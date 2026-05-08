from io import BytesIO

import qrcode
from PIL import Image, ImageDraw, ImageFont
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.colormasks import SolidFillColorMask
from qrcode.image.styles.moduledrawers.pil import RoundedModuleDrawer


CANVAS_SIZE = 960
QR_SIZE = 650


def _font(size, bold=False):
    candidates = [
        'arialbd.ttf' if bold else 'arial.ttf',
        'DejaVuSans-Bold.ttf' if bold else 'DejaVuSans.ttf',
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            continue
    return ImageFont.load_default()


def _draw_center_heart(draw, center_x, center_y, size, fill):
    radius = size // 4
    left_circle = [center_x - radius * 2, center_y - radius, center_x, center_y + radius]
    right_circle = [center_x, center_y - radius, center_x + radius * 2, center_y + radius]
    bottom = [
        (center_x - radius * 2, center_y),
        (center_x + radius * 2, center_y),
        (center_x, center_y + radius * 3),
    ]
    draw.ellipse(left_circle, fill=fill)
    draw.ellipse(right_circle, fill=fill)
    draw.polygon(bottom, fill=fill)


def make_wedding_qr_png(token, code_number):
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=18,
        border=2,
    )
    qr.add_data(token)
    qr.make(fit=True)

    qr_image = qr.make_image(
        image_factory=StyledPilImage,
        module_drawer=RoundedModuleDrawer(radius_ratio=0.82),
        color_mask=SolidFillColorMask(
            back_color=(255, 255, 255),
            front_color=(123, 83, 92),
        ),
    ).convert('RGBA')
    qr_image = qr_image.resize((QR_SIZE, QR_SIZE), Image.Resampling.LANCZOS)

    canvas = Image.new('RGBA', (CANVAS_SIZE, CANVAS_SIZE), (255, 253, 248, 255))
    draw = ImageDraw.Draw(canvas)

    border_color = (188, 145, 110, 255)
    blush = (232, 196, 199, 255)
    sage = (124, 148, 119, 255)
    ink = (98, 53, 65, 255)

    margin = 44
    draw.rounded_rectangle(
        [margin, margin, CANVAS_SIZE - margin, CANVAS_SIZE - margin],
        radius=38,
        outline=border_color,
        width=4,
    )
    draw.rounded_rectangle(
        [margin + 16, margin + 16, CANVAS_SIZE - margin - 16, CANVAS_SIZE - margin - 16],
        radius=28,
        outline=blush,
        width=2,
    )

    for x, y, flip in [(105, 112, False), (CANVAS_SIZE - 105, 112, True), (105, 770, True), (CANVAS_SIZE - 105, 770, False)]:
        leaf_box = [x - 18, y - 8, x + 26, y + 18]
        draw.ellipse(leaf_box, fill=sage)
        draw.ellipse([x - 8, y - 18, x + 18, y + 26], fill=blush)
        stem_end = (x + 38 if not flip else x - 38, y + 30)
        draw.line([(x, y), stem_end], fill=border_color, width=3)

    qr_x = (CANVAS_SIZE - QR_SIZE) // 2
    qr_y = 130
    canvas.alpha_composite(qr_image, (qr_x, qr_y))

    icon_size = 116
    icon_x = CANVAS_SIZE // 2
    icon_y = qr_y + QR_SIZE // 2
    draw.ellipse(
        [
            icon_x - icon_size // 2,
            icon_y - icon_size // 2,
            icon_x + icon_size // 2,
            icon_y + icon_size // 2,
        ],
        fill=(255, 253, 248, 255),
        outline=border_color,
        width=4,
    )
    _draw_center_heart(draw, icon_x, icon_y - 10, 54, fill=(177, 105, 121, 255))

    title_font = _font(46, bold=True)
    meta_font = _font(24)
    title = 'Waleed & Habiba'
    meta = f'Guest Pass #{code_number:03d}'

    title_box = draw.textbbox((0, 0), title, font=title_font)
    title_x = (CANVAS_SIZE - (title_box[2] - title_box[0])) // 2
    draw.text((title_x, 805), title, font=title_font, fill=ink)

    meta_box = draw.textbbox((0, 0), meta, font=meta_font)
    meta_x = (CANVAS_SIZE - (meta_box[2] - meta_box[0])) // 2
    draw.text((meta_x, 862), meta, font=meta_font, fill=(124, 93, 102, 255))

    buffer = BytesIO()
    canvas.convert('RGB').save(buffer, format='PNG', optimize=True)
    return buffer.getvalue()
