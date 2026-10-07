from PIL import Image, ImageFilter
import os

w, h = 1080, 1920

# Two octaves of noise: a fine grain, and a coarser mottle. Blurred unequally so the coarse
# layer stretches sideways — that is what reads as fibre rather than as television static.
fine = Image.effect_noise((w, h), 22).convert("L").filter(ImageFilter.GaussianBlur(0.6))
coarse = Image.effect_noise((w // 4, h // 4), 30).convert("L")
coarse = coarse.resize((w, h), Image.BILINEAR).filter(ImageFilter.GaussianBlur(1.1))
fibre = Image.effect_noise((w // 2, h // 8), 34).convert("L")
fibre = fibre.resize((w, h), Image.BILINEAR).filter(ImageFilter.GaussianBlur(2.2))

out = Image.new("L", (w, h))
fp, cp, bp = fine.load(), coarse.load(), fibre.load()
op = out.load()
for y in range(h):
    for x in range(w):
        v = 250 - (fp[x, y] - 128) * 0.055 - (cp[x, y] - 128) * 0.10 - (bp[x, y] - 128) * 0.045
        op[x, y] = max(214, min(255, int(v)))

out = out.convert("RGB")
dest = "D:/CodeProject/Herbal/remotion-video/public/textures/paper-fibre.jpg"
out.save(dest, quality=88, optimize=True)
print("wrote", dest, round(os.path.getsize(dest) / 1024), "KB")
