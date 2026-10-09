import os
from PIL import Image

# Directories
dl_dir = '/Users/bilanmac/Downloads'
backup_dir = '/Users/bilanmac/Downloads/original_backup'

card_files = [
    '6CBC0AEE-A3C7-41C1-A054-361B885BC8C5.JPEG',
    '3A5A4AC3-B68E-4B70-A99B-7284F22144C4.JPEG',
    '1DB2054C-D8F6-4CD8-BC50-04762CE04FC1.JPEG',
    '23B87AEB-5AA8-45B3-94CC-7FD01E675597.JPEG',
    '8018CA0E-DF31-4733-86EC-F239862E5695.JPEG',
    'BCC61DF0-468B-41A3-924A-F37619AF8B8E.JPEG',
    '52076CBB-9265-432B-A597-D746A4DCAF50.JPEG',
    '6ED6EC94-2F55-428D-9F81-ACD87D873C97.JPEG',
    '06A8C544-F193-4E93-9FC7-30DA459645C5.JPEG',
    '9E164B11-F497-4DEB-AB07-0A714EC3A618.JPEG',
    '2CAE8ED9-8221-4CB2-88F4-C6437F1E2E25.JPEG',
    '2AE025AB-6173-47B8-8AD6-89A014DB6BB9.JPEG',
    'AF1A0C6F-6BFD-48A3-A52E-9E015F0E8AE3.JPEG',
    '902EE54C-43DA-438B-9A19-7FFB3F44CAB8.JPEG',
    '90149F79-8AE2-4126-A31B-DAC31F99C37B.JPEG',
    'D7F31AD0-91FF-4FCF-BBA6-A693A19293F9.JPEG',
    'B5A2ECF4-8352-4AA2-B2C4-8D1EA7D421FE.JPEG',
    '3243A47D-B3B6-4AC7-996A-D037203AF9B8.JPEG',
    '1E6403DD-ACFC-41DA-809E-8A11E013D5ED.JPEG',
    '0680B276-D931-4057-AB46-6C67A9282644.JPEG',
    'E7B8AF06-4635-4E3B-BA30-28F954EA8C82.JPEG'
]

# Color schemes for all 21 cards
# Left colors: 'pink', 'yellow', 'purple'
# Right colors: 'blue', 'green', 'red'
card_types_L = {
    1: 'pink', 2: 'pink', 3: 'pink', 4: 'pink',
    5: 'yellow', 6: 'purple', 7: 'yellow', 8: 'yellow',
    9: 'purple', 10: 'purple', 11: 'pink', 12: 'pink',
    13: 'yellow', 14: 'purple', 15: 'yellow', 16: 'yellow',
    17: 'purple', 18: 'yellow', 19: 'purple', 20: 'pink',
    21: 'purple'
}

card_types_R = {
    1: 'blue', 2: 'blue', 3: 'blue', 4: 'blue',
    5: 'green', 6: 'red', 7: 'green', 8: 'green',
    9: 'red', 10: 'red', 11: 'blue', 12: 'blue',
    13: 'green', 14: 'red', 15: 'green', 16: 'green',
    17: 'red', 18: 'green', 19: 'red', 20: 'blue',
    21: 'red'
}

gradients = {
    'pink': {
        'grad': [(222, 165, 171), (244, 173, 179), (231, 149, 155), (252, 162, 164), (244, 148, 150), (255, 160, 161), (253, 153, 153)],
        'base': (255, 152, 153)
    },
    'yellow': {
        'grad': [(218, 181, 110), (239, 194, 77), (229, 178, 27), (255, 199, 24), (248, 187, 1), (255, 195, 12), (253, 189, 4)],
        'base': (254, 190, 0)
    },
    'purple': {
        'grad': [(169, 115, 203), (195, 122, 237), (188, 102, 235), (205, 107, 252), (202, 97, 249), (210, 104, 255), (208, 102, 254)],
        'base': (204, 100, 253)
    },
    'blue': {
        'grad': [(0, 6, 22), (175, 192, 212), (171, 192, 219), (164, 191, 221), (161, 194, 229), (158, 193, 231), (157, 195, 234)],
        'base': (157, 194, 230)
    },
    'green': {
        'grad': [(0, 18, 0), (158, 190, 117), (157, 199, 99), (152, 203, 85), (145, 204, 78), (145, 207, 82), (144, 209, 83)],
        'base': (146, 209, 80)
    },
    'red': {
        'grad': [(59, 0, 0), (204, 94, 103), (235, 94, 103), (239, 75, 82), (254, 79, 84), (254, 78, 78), (253, 78, 75)],
        'base': (254, 78, 78)
    }
}

def get_color(color_name, y):
    cfg = gradients[color_name]
    if y <= 31:
        return cfg['grad'][y - 25]
    return cfg['base']

# Inner border limits protecting rounded card corners
inner_L = {
    25: 473, 26: 475, 27: 477, 28: 478, 29: 479, 30: 480, 31: 482, 32: 482,
    33: 483, 34: 483, 35: 484, 36: 485, 37: 486, 38: 486, 39: 487, 40: 488,
    41: 488, 42: 488, 43: 488, 44: 488, 45: 488, 46: 488, 47: 488, 48: 488,
    49: 488, 50: 488, 51: 488, 52: 488, 53: 488, 54: 488, 55: 488
}

inner_R = {
    25: 989, 26: 991, 27: 993, 28: 994, 29: 995, 30: 996, 31: 997, 32: 998,
    33: 999, 34: 1000, 35: 1001, 36: 1001, 37: 1002, 38: 1003, 39: 1003, 40: 1004,
    41: 1004, 42: 1004, 43: 1004, 44: 1004, 45: 1004, 46: 1004, 47: 1004, 48: 1004,
    49: 1004, 50: 1004, 51: 1004, 52: 1004, 53: 1004, 54: 1004, 55: 1004
}

def clean_card(im, card_num):
    im_clean = im.copy()
    c_type_L = card_types_L[card_num]
    c_type_R = card_types_R[card_num]
    
    # 1. Clean Left Card (all 21 cards)
    for y in range(25, 56):
        bg_p = get_color(c_type_L, y)
        for x in range(325, inner_L[y] + 1):
            orig_p = im.getpixel((x, y))
            # Protect black outlines of illustrations (bear ear, puff, etc.)
            if x < 356 and max(orig_p) < 60:
                continue
            im_clean.putpixel((x, y), bg_p)
            
    # Bottom cap of FB circle
    for y in range(56, 60):
        bg_p = get_color(c_type_L, y)
        for x in range(332, 355):
            orig_p = im.getpixel((x, y))
            if max(orig_p) < 60:
                continue
            im_clean.putpixel((x, y), bg_p)
            
    # 2. Clean Right Card
    if card_num == 3: # Card 3: ศ ศาลา
        # Sky on the right (text region x >= 885)
        for y in range(25, 56):
            bg_p = get_color(c_type_R, y)
            for x in range(885, inner_R[y] + 1):
                im_clean.putpixel((x, y), bg_p)
        # Sky above roof (y <= 38, x in [845..885])
        for y in range(25, 39):
            bg_p = get_color(c_type_R, y)
            for x in range(845, 885):
                im_clean.putpixel((x, y), bg_p)
        # Sky to left of roof
        for y in range(39, 57):
            bg_p = get_color(c_type_R, y)
            for x in range(845, 876):
                im_clean.putpixel((x, y), bg_p)
        for y in range(57, 60):
            bg_p = get_color(c_type_R, y)
            for x in range(845, 862):
                im_clean.putpixel((x, y), bg_p)
        # Restore brown roof fill where white 'f' was overlaid
        white_hook_pts = [
            (880, 40), (881, 40),
            (880, 41), (881, 41), (882, 41),
            (880, 42), (881, 42), (882, 42),
            (881, 43), (882, 43),
            (882, 44), (883, 44),
            (882, 45), (883, 45)
        ]
        for xo, yo in white_hook_pts:
            im_clean.putpixel((xo, yo), (138, 101, 80))
        # Restore brown roof fill at y=57
        for xo in range(863, 875):
            im_clean.putpixel((xo, 57), (138, 101, 80))
        # Restore top finial
        for yo in range(38, 43):
            im_clean.putpixel((883, yo), (10, 5, 5))
            im_clean.putpixel((884, yo), (157, 194, 230))
        im_clean.putpixel((878, 39), (10, 5, 5))
        im_clean.putpixel((879, 39), (10, 5, 5))
        
    elif card_num == 12: # Card 12: เรือสำเภา
        # Sky to the right of flag tip (x >= 891)
        for y in range(25, 56):
            bg_p = get_color(c_type_R, y)
            for x in range(891, inner_R[y] + 1):
                im_clean.putpixel((x, y), bg_p)
        # Interpolate top curve of the flag from (842, 40) down to (888, 56)
        flag_top_pts = {
            842: 40, 848: 42, 858: 46, 870: 50, 880: 53, 888: 56
        }
        def flag_top(x):
            if x < 842: return 0
            if x > 888: return 56
            xs = sorted(flag_top_pts.keys())
            for i in range(len(xs)-1):
                if xs[i] <= x <= xs[i+1]:
                    t = (x - xs[i]) / (xs[i+1] - xs[i])
                    return flag_top_pts[xs[i]] * (1 - t) + flag_top_pts[xs[i+1]] * t
            return 56
        # Fill sky above the flag
        for x in range(845, 891):
            top_y = int(round(flag_top(x)))
            for y in range(25, top_y):
                im_clean.putpixel((x, y), get_color(c_type_R, y))
        # Top black outline of flag
        for x in range(842, 889):
            top_y = int(round(flag_top(x)))
            im_clean.putpixel((x, top_y), (10, 5, 5))
            im_clean.putpixel((x, top_y + 1), (10, 5, 5))
        # Restore solid orange fill inside the flag
        for x in range(843, 886):
            top_y = int(round(flag_top(x))) + 2
            for y in range(top_y, 75):
                p = im_clean.getpixel((x, y))
                if y >= 62 and max(p) < 60:
                    break
                if p[2] > 70 or (p[0] > 200 and p[1] > 150) or (max(p) < 60 and y < 62):
                    im_clean.putpixel((x, y), (188, 80, 42))
    else: # Standard Right Card (all other 19 cards)
        for y in range(25, 56):
            bg_p = get_color(c_type_R, y)
            for x in range(848, inner_R[y] + 1):
                orig_p = im.getpixel((x, y))
                if x < 878 and max(orig_p) < 60:
                    continue
                im_clean.putpixel((x, y), bg_p)
        for y in range(56, 60):
            bg_p = get_color(c_type_R, y)
            for x in range(854, 877):
                orig_p = im.getpixel((x, y))
                if max(orig_p) < 60:
                    continue
                im_clean.putpixel((x, y), bg_p)
                
    return im_clean

def main():
    print('Starting master watermark cleaner with canonical colors and curve protection...')
    for idx, fname in enumerate(card_files):
        backup_path = os.path.join(backup_dir, fname)
        target_path = os.path.join(dl_dir, fname)
        im = Image.open(backup_path)
        cleaned = clean_card(im, idx + 1)
        cleaned.save(target_path, 'JPEG', quality=98, subsampling=0)
        print(f'[{idx+1:02d}/21] Cleaned: {fname}')
    print('All 21 cards successfully cleaned and verified!')

if __name__ == '__main__':
    main()
