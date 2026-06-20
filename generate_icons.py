import os
from PIL import Image, ImageDraw, ImageFilter

def generate_logo(target_size):
    # Use 4x supersampling for ultra-smooth anti-aliased graphics
    scale = 4
    size = target_size * scale
    center = size // 2
    
    # Create high-res dark space background image
    img = Image.new('RGBA', (size, size), (11, 10, 21, 255))
    draw = ImageDraw.Draw(img)
    
    # Draw a soft glowing background radial gradient
    glow_steps = 50
    max_glow_radius = int(size * 0.45)
    for i in range(glow_steps):
        factor = i / glow_steps
        radius = max_glow_radius * (1 - factor)
        alpha = int(24 * factor) # soft alpha
        # Blend of violet (103, 58, 183) and teal/rose
        color = (103 + int(130 * factor), 58 - int(28 * factor), 183 - int(84 * factor), alpha)
        draw.ellipse([center - radius, center - radius, center + radius, center + radius], fill=color)
        
    # Draw overlapping glowing petals representing different dimensions of the self
    # We will create 6 petals at 30 degree rotations to form a beautiful sacred geometry lotus
    angles = [0, 30, 60, 90, 120, 150]
    petal_colors = [
        (103, 58, 183),  # Violet (Wisdom)
        (63, 81, 181),   # Indigo (Depth)
        (33, 150, 243),  # Blue (Trust)
        (0, 150, 136),   # Teal (Harmony)
        (255, 152, 0),   # Amber (Creativity)
        (233, 30, 99)    # Rose (Passion)
    ]
    
    petal_w = int(size * 0.12)
    petal_h = int(size * 0.35)
    
    for idx, angle in enumerate(angles):
        color = petal_colors[idx]
        
        # Temp image for rotated drawing
        temp = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        tdraw = ImageDraw.Draw(temp)
        
        # Draw translucent filled ellipse
        tdraw.ellipse([center - petal_w, center - petal_h, center + petal_w, center + petal_h], 
                      fill=(color[0], color[1], color[2], 30),
                      outline=(color[0], color[1], color[2], 180),
                      width=int(5 * scale))
                      
        # Rotate temp image
        rotated = temp.rotate(angle, resample=Image.Resampling.BICUBIC)
        # Paste onto main image using alpha composite
        img = Image.alpha_composite(img, rotated)
        
    # Draw a thin crisp outer ring representing alignment and stability
    ring_radius = int(size * 0.36)
    draw.ellipse([center - ring_radius, center - ring_radius, center + ring_radius, center + ring_radius], 
                 outline=(255, 255, 255, 45), width=int(2 * scale))
                 
    # Draw 4 alignment ticks (North, East, South, West)
    tick_len = int(12 * scale)
    tick_width = int(3 * scale)
    # North
    draw.line([center, center - ring_radius - tick_len, center, center - ring_radius + tick_len], fill=(255, 255, 255, 180), width=tick_width)
    # South
    draw.line([center, center + ring_radius - tick_len, center, center + ring_radius + tick_len], fill=(255, 255, 255, 180), width=tick_width)
    # East
    draw.line([center + ring_radius - tick_len, center, center + ring_radius + tick_len, center], fill=(255, 255, 255, 180), width=tick_width)
    # West
    draw.line([center - ring_radius - tick_len, center, center - ring_radius + tick_len, center], fill=(255, 255, 255, 180), width=tick_width)
                 
    # Central sparkling core diamond representing the synthesized blueprint
    core_w = int(15 * scale)
    core_h = int(25 * scale)
    
    # Draw two overlapping diamonds: vertical and horizontal
    core_temp = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    cdraw = ImageDraw.Draw(core_temp)
    # Vertical diamond
    cdraw.polygon([
        (center, center - core_h),
        (center + core_w, center),
        (center, center + core_h),
        (center - core_w, center)
    ], fill=(255, 255, 255, 255), outline=(0, 150, 136, 255), width=int(1.5 * scale))
    # Horizontal diamond (slightly wider but shorter)
    cdraw.polygon([
        (center, center - core_w),
        (center + core_h, center),
        (center, center + core_w),
        (center - core_h, center)
    ], fill=(255, 255, 255, 220), outline=(0, 150, 136, 255), width=int(1.5 * scale))
    
    img = Image.alpha_composite(img, core_temp)
    
    # Small central glowing cap dot
    pin_radius = int(5 * scale)
    draw.ellipse([center - pin_radius, center - pin_radius, center + pin_radius, center + pin_radius], 
                 fill=(255, 255, 255, 255), outline=(233, 30, 99, 255), width=int(1.5 * scale))

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
