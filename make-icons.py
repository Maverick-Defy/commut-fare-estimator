# Builds the logo and icon files from the official logo (logo-source.jpg, 640x640).
from PIL import Image
src = Image.open('logo-source.jpg').convert('RGB')
def size(px): return src.resize((px, px), Image.LANCZOS)
size(96).save('logo-96.png', optimize=True)      # header logo, shown at 48px (2x)
size(16).save('favicon-16.png'); size(32).save('favicon-32.png')
size(180).save('apple-touch-icon.png', optimize=True)
size(192).save('favicon-192.png', optimize=True)
size(256).save('favicon.ico', format='ICO', sizes=[(16,16),(32,32),(48,48)])
