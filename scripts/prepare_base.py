import os
import shutil
from PIL import Image, ImageOps, ImageFilter
import numpy as np

SRC = r"e:\code\Ashi Tunnel\assets\ashi"
OUT_BASE = r"e:\code\Ashi Tunnel\public\ashi\base"
OUT_VAR = r"e:\code\Ashi Tunnel\public\ashi\variants"
os.makedirs(OUT_BASE, exist_ok=True)
os.makedirs(OUT_VAR, exist_ok=True)

def load_norm(filename, size=None):
    p = os.path.join(SRC, filename)
    im = ImageOps.exif_transpose(Image.open(p)).convert("RGB")
    if size and im.size != size:
        im = im.resize(size, Image.Resampling.LANCZOS)
    return im

# 1. Base Landscape 4:3 (1200x900)
base_land = {
    "L1_sleep.jpg": "1.jpeg",
    "L2_chin.jpg": "2.jpeg",
    "L3_sofa.jpg": "4.jpeg",
    "L4_pizza.jpg": "1792547722853.jpg",
    "L5_skydive.jpg": "6.jpeg",
}
for out_name, src_name in base_land.items():
    im = load_norm(src_name, (1200, 900))
    im.save(os.path.join(OUT_BASE, out_name), quality=93)

# 2. Base Portrait 3:4 (960x1280)
base_port = {
    "R1_class.jpg": "IMG_20260921_130220.jpg",
    "R2_dog.jpg": "IMG_0333.JPG",
    "R3_spider.jpg": "IMG_0335.JPG",
    "R4_cafe.jpg": "IMG_0288.JPG",
    "R5_sideeye.jpg": "1000010702.jpg",
}
for out_name, src_name in base_port.items():
    im = load_norm(src_name, (960, 1280))
    im.save(os.path.join(OUT_BASE, out_name), quality=93)

# 3. Special Corridor Posters / Props
load_norm("ed9e7aa4-dc13-498d-971e-040f8962f4d0.jpeg", (1280, 640)).save(
    os.path.join(OUT_BASE, "S1_gekko.jpg"), quality=93
)
load_norm("Gemini_Generated_Image_980u6n980u6n980u.jpeg", (840, 1260)).save(
    os.path.join(OUT_BASE, "S2_fourarms.jpg"), quality=93
)
load_norm("Gemini_Generated_Image_kwy6itkwy6itkwy6.jpeg", (840, 1260)).save(
    os.path.join(OUT_BASE, "S3_larva.jpg"), quality=93
)
load_norm("1000003143.jpg", (400, 580)).save(
    os.path.join(OUT_BASE, "S4_bald_sticker.jpg"), quality=93
)

# Extra TV / Easter Egg / Jumpscare images from zip
load_norm("1000010594.jpg", (960, 1280)).save(os.path.join(OUT_VAR, "TV_urinal.jpg"), quality=92)
load_norm("1000010497.jpg", (960, 1280)).save(os.path.join(OUT_VAR, "TV_choke.jpg"), quality=92)
load_norm("Gemini_Generated_Image_njs9nynjs9nynjs9.jpg", (960, 1280)).save(os.path.join(OUT_VAR, "TV_capbed.jpg"), quality=92)

# 4. Existing Variants normalized to exact matching dimensions
existing_land_vars = {
    "L1_var_eyes_open.jpg": "7.jpeg",
    "L1_var_bird_pink.jpg": "5.jpeg",
    "L1_var_bird_yellow.jpg": "Gemini_Generated_Image_r2mua9r2mua9r2mu.jpg",
    "L1_var_bird_bomb.jpg": "Gemini_Generated_Image_w62h0zw62h0zw62h.jpg",
    "L1_var_shrek.jpg": "Gemini_Generated_Image_9bccp39bccp39bcc.jpeg",
    "L1_var_kaneki.jpg": "Gemini_Generated_Image_ovar5lovar5lovar.jpeg",
    "L2_var_gigachad.jpg": "3.jpeg",
    "L4_var_hair_pizza.jpg": "Gemini_Generated_Image_8ffdat8ffdat8ffd.jpg",
    "L4_var_shirtless_crop.jpg": "IMG_20261021_085203.jpg",
}
for out_name, src_name in existing_land_vars.items():
    im = load_norm(src_name, (1200, 900))
    im.save(os.path.join(OUT_VAR, out_name), quality=93)

existing_port_vars = {
    "R1_var_torn_shirt.jpg": "Gemini_Generated_Image_nkpk4ynkpk4ynkpk.jpeg",
    "R1_var_chubby.jpg": "Gemini_Generated_Image_t2e45ct2e45ct2e4.jpeg",
}
for out_name, src_name in existing_port_vars.items():
    im = load_norm(src_name, (960, 1280))
    im.save(os.path.join(OUT_VAR, out_name), quality=93)

# Extend 1:1 square blue-tarp variants (green dress & red bikini) cleanly onto 1200x900 4:3 blue tarp
tarp_bg = load_norm("1792547722853.jpg", (1200, 900))
for out_name, src_name in [
    ("L4_var_green_dress.jpg", "Gemini_Generated_Image_4g9dic4g9dic4g9d.jpg"),
    ("L4_var_red_bikini.jpg", "qwen_edit_20261004_234512.png"),
]:
    sq = load_norm(src_name, (900, 900))
    canvas = tarp_bg.copy()
    # Create soft horizontal alpha blend at edges of the 900x900 center (x=150..1050)
    mask = np.ones((900, 900), dtype=np.float32)
    feather = 70
    ramp = np.linspace(0.0, 1.0, feather, dtype=np.float32)
    mask[:, :feather] = ramp[None, :]
    mask[:, -feather:] = ramp[::-1][None, :]
    mask_im = Image.fromarray((mask * 255).astype(np.uint8), mode="L")
    canvas.paste(sq, (150, 0), mask_im)
    canvas.save(os.path.join(OUT_VAR, out_name), quality=93)

# Copy video
vid_src = os.path.join(SRC, "IMG_0123.MOV")
vid_dst = r"e:\code\Ashi Tunnel\public\ashi\promo.mov"
if not os.path.exists(vid_dst):
    shutil.copy2(vid_src, vid_dst)

print("Base and existing variants prepared successfully!")

