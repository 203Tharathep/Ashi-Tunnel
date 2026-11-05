import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

BASE_DIR = r"e:\code\Ashi Tunnel\public\ashi\base"
VAR_DIR = r"e:\code\Ashi Tunnel\public\ashi\variants"
ART_DIR = r"C:\Users\admin\.gemini\antigravity\brain\531f1f58-a12d-4016-99d2-1b7b44af4fd2"
SCRATCH = os.path.join(ART_DIR, "scratch")
os.makedirs(VAR_DIR, exist_ok=True)
os.makedirs(SCRATCH, exist_ok=True)

def load_img(path, size=None):
    im = Image.open(path).convert("RGB")
    if size and im.size != size:
        im = im.resize(size, Image.Resampling.LANCZOS)
    return im

def paste_feathered(base_im, src_im, box, feather=18):
    """Paste only `box` (x1, y1, x2, y2) from `src_im` onto a copy of `base_im` with smooth feathered edges."""
    out = base_im.copy()
    x1, y1, x2, y2 = box
    patch = src_im.crop((x1, y1, x2, y2))
    pw, ph = x2 - x1, y2 - y1
    mask = Image.new("L", (pw, ph), 0)
    d = ImageDraw.Draw(mask)
    pad = max(2, feather)
    d.rectangle([pad, pad, pw - pad, ph - pad], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(radius=feather / 2.0))
    out.paste(patch, (x1, y1), mask)
    return out

# -------------------------------------------------------------------------
# 1. Copy & Composite AI-Generated Variants from Artifact Directory
# -------------------------------------------------------------------------
ai_full = [
    ("4_eyes_open_1793900916523.jpg", "L3_var_eyes_open.jpg", (1200, 900)),
    ("4_clown_peek_1793900939753.jpg", "L3_var_clown.jpg", (1200, 900)),
    ("6_scream_1793900961177.jpg", "L5_var_scream.jpg", (1200, 900)),
    ("0333_cerberus_1793900985871.jpg", "R2_var_cerberus.jpg", (960, 1280)),
    ("0288_stare_final_1793900993937.jpg", "R4_var_stare.jpg", (960, 1280)),
    ("0335_symbiote_1793901058098.jpg", "R3_var_symbiote.jpg", (960, 1280)),
]
for src_fn, dst_fn, sz in ai_full:
    im = load_img(os.path.join(ART_DIR, src_fn), sz)
    im.save(os.path.join(VAR_DIR, dst_fn), quality=93)

# Composite ONLY face/eyes of 10702_stare onto R5_sideeye.jpg so background/hand are 100% pixel-identical
r5_base = load_img(os.path.join(BASE_DIR, "R5_sideeye.jpg"), (960, 1280))
r5_ai = load_img(os.path.join(ART_DIR, "10702_stare_1793900921786.jpg"), (960, 1280))
r5_stare = paste_feathered(r5_base, r5_ai, (290, 120, 880, 770), feather=36)
r5_stare.save(os.path.join(VAR_DIR, "R5_var_stare.jpg"), quality=93)

# Split r4_cafe_anomaly_v2 into TWO surgical Hard/Extreme anomalies!
r4_base = load_img(os.path.join(BASE_DIR, "R4_cafe.jpg"), (960, 1280))
r4_ai = load_img(os.path.join(ART_DIR, "r4_cafe_anomaly_v2_1793901164364.jpg"), (960, 1280))

# R4 Surgical A: 6 fingers on chest hand (Hard)
r4_six = paste_feathered(r4_base, r4_ai, (55, 680, 345, 975), feather=20)
r4_six.save(os.path.join(VAR_DIR, "R4_surg_six_fingers.jpg"), quality=93)

# R4 Surgical B: Girl in far-left background staring straight at viewer (Extreme)
r4_girl = paste_feathered(r4_base, r4_ai, (0, 310, 105, 565), feather=14)
r4_girl.save(os.path.join(VAR_DIR, "R4_surg_bg_girl.jpg"), quality=93)

# Split r2_dog_anomaly into TWO surgical Hard/Extreme anomalies!
r2_base = load_img(os.path.join(BASE_DIR, "R2_dog.jpg"), (960, 1280))
r2_ai = load_img(os.path.join(ART_DIR, "r2_dog_anomaly_1793901186015.jpg"), (960, 1280))

# R2 Surgical A: Missing dog collar & black bone tag (Hard/Extreme)
r2_nocollar = paste_feathered(r2_base, r2_ai, (370, 585, 600, 785), feather=22)
r2_nocollar.save(os.path.join(VAR_DIR, "R2_surg_no_collar.jpg"), quality=93)

# R2 Surgical B: Man in white shirt at top-left desk turned around staring at camera (Extreme!)
r2_bgman = paste_feathered(r2_base, r2_ai, (85, 75, 225, 360), feather=16)
r2_bgman.save(os.path.join(VAR_DIR, "R2_surg_bg_man.jpg"), quality=93)

# -------------------------------------------------------------------------
# 2. Pure Pixel-Exact Surgical Edits for Hard & Extreme Stages (7-10)
# -------------------------------------------------------------------------

# (A) L3_sofa.jpg -> L3_surg_w_fries.jpg: Flip McDonald's 'M' into 'W' on fries carton! (Extreme)
l3_base = load_img(os.path.join(BASE_DIR, "L3_sofa.jpg"), (1200, 900))
l3_wfries = l3_base.copy()
m_box = (664, 784, 696, 829)
m_patch = l3_base.crop(m_box).transpose(Image.Transpose.FLIP_TOP_BOTTOM)
l3_wfries = paste_feathered(l3_wfries, ImageOps_paste_helper := l3_base.copy(), (0,0,10,10), 2)
# Paste rotated M cleanly with elliptical feather mask
m_canvas = l3_base.copy()
m_canvas.paste(m_patch, (m_box[0], m_box[1]))
mask_m = Image.new("L", (m_box[2]-m_box[0], m_box[3]-m_box[1]), 0)
ImageDraw.Draw(mask_m).ellipse([2, 2, m_box[2]-m_box[0]-2, m_box[3]-m_box[1]-2], fill=255)
mask_m = mask_m.filter(ImageFilter.GaussianBlur(3))
l3_wfries = l3_base.copy()
l3_wfries.paste(m_patch, (m_box[0], m_box[1]), mask_m)
l3_wfries.save(os.path.join(VAR_DIR, "L3_surg_w_fries.jpg"), quality=93)

# (B) L3_sofa.jpg -> L3_surg_no_bottle.jpg: Remove standing plastic water bottle on sofa top (Extreme)
l3_nobottle = l3_base.copy()
arr_l3 = np.array(l3_nobottle, dtype=np.float32)
# Bottle sits at x=794..828, y=284..372 against smooth wall gradient on right (x=832..866)
for y in range(282, 368):
    # Interpolate horizontally between left wall pixels (x=786..792) and right wall pixels (x=831..837)
    left_col = arr_l3[y, 785:791].mean(axis=0)
    right_col = arr_l3[y, 832:838].mean(axis=0)
    w_span = 831 - 791
    for i, x in enumerate(range(791, 831)):
        t = i / max(1, w_span - 1)
        noise = np.random.normal(0, 1.5, 3)
        arr_l3[y, x] = np.clip((1 - t) * left_col + t * right_col + noise, 0, 255)
l3_nobottle = paste_feathered(l3_base, Image.fromarray(arr_l3.astype(np.uint8)), (787, 280, 835, 370), feather=6)
l3_nobottle.save(os.path.join(VAR_DIR, "L3_surg_no_bottle.jpg"), quality=93)

# (C) L4_pizza.jpg -> L4_surg_one_nipple.jpg: Smoothly heal right nipple (viewer's left) into chest skin (Extreme)
l4_base = load_img(os.path.join(BASE_DIR, "L4_pizza.jpg"), (1200, 900))
arr_l4 = np.array(l4_base, dtype=np.float32)
for y in range(494, 536):
    top_skin = arr_l4[488:493, 492:528]
    bot_skin = arr_l4[537:542, 492:528]
    t = (y - 494) / (536 - 494)
    row_skin = (1 - t) * top_skin.mean(axis=0) + t * bot_skin.mean(axis=0)
    arr_l4[y, 492:528] = np.clip(row_skin + np.random.normal(0, 1.2, row_skin.shape), 0, 255)
l4_nonip = paste_feathered(l4_base, Image.fromarray(arr_l4.astype(np.uint8)), (488, 490, 532, 540), feather=8)
l4_nonip.save(os.path.join(VAR_DIR, "L4_surg_one_nipple.jpg"), quality=93)

# (D) L5_skydive.jpg -> L5_surg_mini_twin.jpg: Distant tiny second skydiving Ashi in clouds on upper right! (Extreme)
l5_base = load_img(os.path.join(BASE_DIR, "L5_skydive.jpg"), (1200, 900))
# Create miniature silhouette/atmospheric cutout of skydiving Ashi from L5 itself!
mini = l5_base.crop((95, 75, 1180, 760)).resize((115, 72), Image.Resampling.LANCZOS)
# Mask non-sky pixels of L5 crop (skin/hair/boxers vs blue/white sky)
mini_arr = np.array(mini, dtype=np.float32)
# Sky has high blue relative to red (B - R > 18) or very high brightness white cloud (>215 all channels)
r, g, b = mini_arr[:,:,0], mini_arr[:,:,1], mini_arr[:,:,2]
is_person = ((r - b) > -8) & ~((r > 205) & (g > 210) & (b > 218))
alpha = Image.fromarray((is_person.astype(np.uint8) * 215), mode="L").filter(ImageFilter.GaussianBlur(1.2))
# Blend atmospheric haze onto mini figure
haze = np.full_like(mini_arr, [175, 202, 232])
mini_hazy = Image.fromarray((0.68 * mini_arr + 0.32 * haze).astype(np.uint8))
l5_twin = l5_base.copy()
l5_twin.paste(mini_hazy, (955, 155), alpha)
l5_twin.save(os.path.join(VAR_DIR, "L5_surg_mini_twin.jpg"), quality=93)

# (E) R1_class.jpg -> R1_surg_blue_badge.jpg: Red tie emblem turns vivid cyan-blue! (Extreme)
r1_base = load_img(os.path.join(BASE_DIR, "R1_class.jpg"), (960, 1280))
arr_r1 = np.array(r1_base, dtype=np.float32)
sub = arr_r1[900:975, 510:580].copy()
sr, sg, sb = sub[:,:,0], sub[:,:,1], sub[:,:,2]
red_mask = np.clip(((sr - sg) - 14) / 22.0, 0.0, 1.0)
# Swap red channel into bright cyan-emerald badge while preserving fabric texture & shading!
new_r = sr * (1 - red_mask) + (sg * 0.45) * red_mask
new_g = sg * (1 - red_mask) + (sr * 0.95) * red_mask
new_b = sb * (1 - red_mask) + np.clip(sr * 1.25 + 20, 0, 255) * red_mask
arr_r1[900:975, 510:580, 0] = new_r
arr_r1[900:975, 510:580, 1] = new_g
arr_r1[900:975, 510:580, 2] = new_b
Image.fromarray(arr_r1.astype(np.uint8)).save(os.path.join(VAR_DIR, "R1_surg_blue_badge.jpg"), quality=93)

# (F) R1_class.jpg -> R1_surg_no_hinge.jpg: Upper right door metal hinge disappears! (Extreme Stage 10!)
arr_r1h = np.array(r1_base, dtype=np.float32)
# Copy clean door frame strip right below the upper hinge (y=560..715, x=798..852) over y=398..553!
clean_door_strip = arr_r1h[565:720, 798:852].copy()
arr_r1h[398:553, 798:852] = clean_door_strip
r1_nohinge = paste_feathered(r1_base, Image.fromarray(arr_r1h.astype(np.uint8)), (795, 394, 855, 557), feather=5)
r1_nohinge.save(os.path.join(VAR_DIR, "R1_surg_no_hinge.jpg"), quality=93)

# (G) R3_spider.jpg -> R3_surg_no_phone.jpg: Remove grey iPhone protruding left & right of red fist on stage (Extreme)
r3_base = load_img(os.path.join(BASE_DIR, "R3_spider.jpg"), (960, 1280))
arr_r3 = np.array(r3_base, dtype=np.float32)
sub_p = arr_r3[985:1098, 285:460].copy()
pr, pg, pb = sub_p[:,:,0], sub_p[:,:,1], sub_p[:,:,2]
# Red spider-glove has strong R >> G,B (pr - pg > 22). The iPhone case/lenses are neutral grey/silver/purple-grey (|pr - pb| < 26 and brightness > 38)
not_red_glove = (pr - pg) < 18
stage_sample = arr_r3[955:975, 290:455].mean(axis=(0,1)) # Dark stage matte color ~ [25, 22, 28]
mask_phone = not_red_glove.astype(np.float32)
mask_phone_img = Image.fromarray((mask_phone * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.5))
mf = np.array(mask_phone_img, dtype=np.float32)[:,:,None] / 255.0
noise = np.random.normal(0, 1.2, sub_p.shape)
sub_p_clean = np.clip(sub_p * (1 - mf) + (stage_sample + noise) * mf, 0, 255)
arr_r3[985:1098, 285:460] = sub_p_clean
r3_nophone = paste_feathered(r3_base, Image.fromarray(arr_r3.astype(np.uint8)), (282, 982, 463, 1101), feather=5)
r3_nophone.save(os.path.join(VAR_DIR, "R3_surg_no_phone.jpg"), quality=93)

# (H) S3_larva.jpg -> S3_surg_no_antenna.jpg: Yellow Larva's top antenna disappears! (Hard/Extreme)
s3_base = load_img(os.path.join(BASE_DIR, "S3_larva.jpg"), (840, 1260))
arr_s3 = np.array(s3_base, dtype=np.float32)
# Sample clean off-white background at x=470..490, y=430..520
bg_col = arr_s3[430:510, 460:485].mean(axis=(0,1))
# Antenna stalk & ball sit in x=510..595, y=435..522 (above yellow brow crest at y~525)
poly_mask = Image.new("L", s3_base.size, 0)
ImageDraw.Draw(poly_mask).polygon([(508, 520), (520, 435), (598, 435), (598, 515), (542, 526)], fill=255)
poly_mask = poly_mask.filter(ImageFilter.GaussianBlur(2.0))
pm = np.array(poly_mask, dtype=np.float32)[:,:,None] / 255.0
bg_layer = np.clip(bg_col + np.random.normal(0, 0.8, arr_s3.shape), 0, 255)
s3_noant = Image.fromarray((arr_s3 * (1 - pm) + bg_layer * pm).astype(np.uint8))
s3_noant.save(os.path.join(VAR_DIR, "S3_surg_no_antenna.jpg"), quality=93)

# (I) S2_fourarms.jpg -> S2_surg_two_eyes.jpg: Four-Arms Ashi only has 2 eyes instead of 4! (Hard)
s2_base = load_img(os.path.join(BASE_DIR, "S2_fourarms.jpg"), (840, 1260))
# Let's inspect S2 face box first and save a check crop so we heal the exact lower eyes!
arr_s2 = np.array(s2_base, dtype=np.float32)

# (J) S1_gekko.jpg -> S1_surg_red_orbs.jpg: Green Gekko waist orbs turn glowing crimson red! (Hard)
s1_base = load_img(os.path.join(BASE_DIR, "S1_gekko.jpg"), (1280, 640))
arr_s1 = np.array(s1_base, dtype=np.float32)
for (x1, y1, x2, y2) in [(195, 365, 275, 440), (605, 255, 705, 345), (925, 445, 990, 525)]:
    patch = arr_s1[y1:y2, x1:x2].copy()
    pr, pg, pb = patch[:,:,0], patch[:,:,1], patch[:,:,2]
    green_dom = np.clip(((pg - pr) - 18) / 35.0, 0.0, 1.0)
    patch[:,:,0] = pr * (1 - green_dom) + np.clip(pg * 1.15 + 25, 0, 255) * green_dom
    patch[:,:,1] = pg * (1 - green_dom) + (pr * 0.35) * green_dom
    patch[:,:,2] = pb * (1 - green_dom) + (pb * 0.4) * green_dom
    arr_s1[y1:y2, x1:x2] = patch
Image.fromarray(arr_s1.astype(np.uint8)).save(os.path.join(VAR_DIR, "S1_surg_red_orbs.jpg"), quality=93)

# Save a visual verification sheet of ALL surgical edits!
verify_items = [
    ("R4_surg_six_fingers.jpg", (40, 660, 360, 990), "R4: 6 Fingers"),
    ("R4_surg_bg_girl.jpg", (0, 290, 140, 580), "R4: BG Girl Stare"),
    ("R2_surg_no_collar.jpg", (340, 560, 620, 810), "R2: No Collar Tag"),
    ("R2_surg_bg_man.jpg", (60, 60, 260, 380), "R2: BG Man Turn"),
    ("L3_surg_w_fries.jpg", (630, 750, 730, 860), "L3: W Fries"),
    ("L3_surg_no_bottle.jpg", (750, 260, 870, 395), "L3: No Bottle"),
    ("L4_surg_one_nipple.jpg", (450, 465, 565, 565), "L4: Missing Nipple"),
    ("L5_surg_mini_twin.jpg", (910, 120, 1110, 270), "L5: Cloud Twin"),
    ("R1_surg_blue_badge.jpg", (490, 880, 600, 995), "R1: Blue Badge"),
    ("R1_surg_no_hinge.jpg", (770, 375, 880, 575), "R1: No Door Hinge"),
    ("R3_surg_no_phone.jpg", (270, 965, 475, 1115), "R3: No iPhone"),
    ("S3_surg_no_antenna.jpg", (475, 415, 615, 555), "S3: No Antenna"),
]
vsheet = Image.new("RGB", (1200, 620), (20, 20, 24))
for idx, (fn, box, title) in enumerate(verify_items):
    im = Image.open(os.path.join(VAR_DIR, fn)).crop(box).resize((190, 190))
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 189, 22], fill=(0, 0, 0))
    d.text((5, 5), title, fill=(80, 255, 120))
    vsheet.paste(im, ((idx % 6) * 200 + 5, (idx // 6) * 205 + 5))

# Also include S2 face crop with coordinates to inspect lower eyes!
s2_face = s2_base.crop((430, 0, 620, 160)).resize((190, 190))
d2 = ImageDraw.Draw(s2_face)
d2.text((5, 5), "S2 Face (430,0..620,160)", fill=(255, 220, 0))
vsheet.paste(s2_face, (5, 415))

s1_crop = Image.open(os.path.join(VAR_DIR, "S1_surg_red_orbs.jpg")).crop((560, 210, 760, 390)).resize((190, 190))
ImageDraw.Draw(s1_crop).text((5, 5), "S1 Red Orb", fill=(80, 255, 120))
vsheet.paste(s1_crop, (205, 415))

vsheet.save(os.path.join(SCRATCH, "surgical_verify.jpg"), quality=92)
print("All surgical anomalies generated and verification sheet saved!")

