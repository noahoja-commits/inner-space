import os
from PIL import Image, ImageDraw, ImageFilter

def generate_logo(target_size):
    # Use 4x supersampling for ultra-smooth anti-aliased graphics
    scale = 4
    size = target_size * scale
    center = size // 2
    
    # Create high-res image
    img = Image.new('RGBA', (size, size), (11, 10, 21, 255))
    draw = ImageDraw.Draw(img)
    
    # Draw a soft glowing background radial gradient
    # We do this by drawing filled circles with decreasing alpha
    glow_steps = 40
    max_glow_radius = int(size * 0.45)
    for i in range(glow_steps):
        factor = i / glow_steps
        radius = max_glow_radius * (1 - factor)
        alpha = int(18 * factor) # soft alpha
        # Blend of violet (103, 58, 183) and rose (233, 30, 99)
        color = (103 + int(130 * factor), 58 - int(28 * factor), 183 - int(84 * factor), alpha)
        draw.ellipse([center - radius, center - radius, center + radius, center + radius], fill=color)
        
    # Draw a crisp, sleek outer ring (Teal/Violet gradient look)
    ring_radius = int(size * 0.32)
    ring_width = int(12 * scale)
    draw.ellipse([center - ring_radius, center - ring_radius, center + ring_radius, center + ring_radius], 
                 outline=(0, 150, 136, 255), width=ring_width)
                 
    # Draw compass axis markings (dots at North, South, East, West)
    dot_radius = int(8 * scale)
    dist = int(size * 0.26)
    positions = [
        (center, center - dist), # North
        (center + dist, center), # East
        (center, center + dist), # South
        (center - dist, center)  # West
    ]
    for pos in positions:
        draw.ellipse([pos[0] - dot_radius, pos[1] - dot_radius, pos[0] + dot_radius, pos[1] + dot_radius], 
                     fill=(255, 255, 255, 220))
                     
    # Draw central needle diamond
    # North pointer (Rose)
    needle_w = int(16 * scale)
    needle_h = int(90 * scale)
    draw.polygon([
        (center, center - needle_h),
        (center - needle_w, center),
        (center, center),
    ], fill=(233, 30, 99, 255))
    
    draw.polygon([
        (center, center - needle_h),
        (center + needle_w, center),
        (center, center),
    ], fill=(255, 75, 140, 255)) # lighter rose for 3D bevel effect
    
    # South pointer (White/Teal)
    draw.polygon([
        (center, center + needle_h),
        (center - needle_w, center),
        (center, center),
    ], fill=(200, 200, 200, 255))
    
    draw.polygon([
        (center, center + needle_h),
        (center + needle_w, center),
        (center, center),
    ], fill=(255, 255, 255, 255))
    
    # Central cap pin (Teal dot)
    pin_radius = int(6 * scale)
    draw.ellipse([center - pin_radius, center - pin_radius, center + pin_radius, center + pin_radius], 
                 fill=(0, 150, 136, 255), outline=(255, 255, 255, 255), width=int(1.5 * scale))

    # Downsample using Lanczos interpolation to target size
    final_img = img.resize((target_size, target_size), resample=Image.Resampling.LANCZOS)
    return final_img

if __name__ == '__main__':
    print("Generating PWA icons using Pillow...")
    icon192 = generate_logo(192)
    icon192.save('icon-192.png', 'PNG')
    print("Saved icon-192.png")
    
    icon512 = generate_logo(512)
    icon512.save('icon-512.png', 'PNG')
    print("Saved icon-512.png")
    print("Icon generation complete!")
