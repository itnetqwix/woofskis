import React from 'react';

/**
 * AboutDoodleWallpaper (Woofskis)
 * 
 * WhatsApp-inspired repeating doodle wallpaper for the Woofskis About page body background.
 * Refined for higher visibility, denser 320x320 tile distribution, and rich scale variety
 * (large hero anchors, medium icons, and small filler sparkles/paws/twinkles):
 * - Large & baby paw prints & paw-shaped hearts
 * - Floppy puppy ears & alert corgi faces
 * - Tasty dog bones & bones with ribbon bows
 * - Wagging tails with happy motion streaks
 * - Collars with heart charms, food bowls & cozy peaked doghouses
 * - Royal pup tiara/crown, tennis balls, frisbee discs, pookie sparkles & sleepy "Zzz" clouds
 *
 * Utilizes Woofskis' primary brand color tokens with enhanced contrast:
 * - Primary: Woofskis Vibrant Orange (#fa4616 / dark mode: #ff501c)
 * - Secondary: Warm Chocolate Brown (#3e2717 / dark mode: #fb923c)
 * - Playful Accents: Rose (#f43f5e / #fb7185) & Amber Gold (#f59e0b / #fbbf24)
 */
export function AboutDoodleWallpaper() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden opacity-[0.13] transition-opacity duration-500 dark:opacity-[0.17]"
    >
      <svg
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern
            id="woofskis-about-doodles"
            width="320"
            height="320"
            patternUnits="userSpaceOnUse"
          >
            {/* =================================================================
                TIER 1: HERO / LARGE ANCHOR DOODLES (scale 1.15 - 1.25)
                ================================================================= */}
            {/* 1. Large Classic Paw Print */}
            <g
              transform="translate(45, 42) rotate(-15) scale(1.2)"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              className="stroke-[#fa4616] dark:stroke-[#ff501c]"
            >
              <path d="M -7,2 C -7,-3 -2,-6 0,-6 C 2,-6 7,-3 7,2 C 7,7 3,9 0,7 C -3,9 -7,7 -7,2 Z" />
              <ellipse cx="-7" cy="-7" rx="2.5" ry="3.2" transform="rotate(-20 -7 -7)" />
              <ellipse cx="-2.5" cy="-11" rx="2.6" ry="3.5" transform="rotate(-6 -2.5 -11)" />
              <ellipse cx="2.5" cy="-11" rx="2.6" ry="3.5" transform="rotate(6 2.5 -11)" />
              <ellipse cx="7" cy="-7" rx="2.5" ry="3.2" transform="rotate(20 7 -7)" />
            </g>

            {/* 2. Large Happy Floppy-Eared Pup Face */}
            <g
              transform="translate(200, 45) rotate(12) scale(1.18)"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              className="stroke-[#fa4616] dark:stroke-[#ff501c]"
            >
              <path d="M -9,3 C -9,9 9,9 9,3 C 9,-3 6,-7 0,-7 C -6,-7 -9,-3 -9,3 Z" />
              <path d="M -8,-4 C -13,-4 -14,4 -10,6 C -8,7 -7,1 -7,-2" />
              <path d="M 8,-4 C 13,-4 14,4 10,6 C 8,7 7,1 7,-2" />
              <path d="M -5,-1 Q -3.5,-3 -2,-1 M 2,-1 Q 3.5,-3 5,-1" />
              <path d="M -1.5,2 L 1.5,2 L 0,3.5 Z" />
              <path d="M -1.5,4 C -1.5,6.5 1.5,6.5 1.5,4" />
            </g>

            {/* 3. Large Cartoon Dog Bone */}
            <g
              transform="translate(120, 148) rotate(-18) scale(1.15)"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              className="stroke-[#3e2717] dark:stroke-[#fb923c]"
            >
              <path d="M -10,-3 L 10,-3 C 10,-6 14,-6 15,-4 C 17,-3 17,0 15,1 C 17,2 17,5 15,6 C 14,8 10,7 10,4 L -10,4 C -10,7 -14,8 -15,6 C -17,5 -17,2 -15,1 C -17,0 -17,-3 -15,-4 C -14,-6 -10,-6 -10,-3 Z" />
            </g>

            {/* 4. Large Cozy Peaked Doghouse */}
            <g
              transform="translate(280, 152) rotate(15) scale(1.15)"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              className="stroke-[#3e2717] dark:stroke-[#fb923c]"
            >
              <path d="M 0,-11 L 11,-2 L 8,-2 L 8,-8 L 5.5,-8 L 5.5,-4.5 L 0,-9 L -8,-2 L -11,-2 Z" />
              <path d="M -7.5,-2 L -7.5,9 L 7.5,9 L 7.5,-2" />
              <path d="M -3.5,9 L -3.5,3 C -3.5,0.8 3.5,0.8 3.5,3 L 3.5,9" />
            </g>

            {/* 5. Large Alert Pointy-Eared Corgi Face */}
            <g
              transform="translate(42, 260) rotate(-12) scale(1.15)"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              className="stroke-[#fa4616] dark:stroke-[#ff501c]"
            >
              <circle cx="0" cy="2" r="8" />
              <path d="M -6,-3 L -10,-12 L -2,-7 Z" />
              <path d="M 6,-3 L 10,-12 L 2,-7 Z" />
              <path d="M -4,1 Q -2.5,-0.5 -1,1 M 2,1 L 5,1" />
              <ellipse cx="0" cy="4" rx="2" ry="1.4" />
            </g>

            {/* 6. Large Royal Pup Tiara / Crown */}
            <g
              transform="translate(205, 265) rotate(20) scale(1.15)"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              className="stroke-[#f59e0b] dark:stroke-[#fbbf24]"
            >
              <path d="M -8,5 L -10,-4 L -4,0 L 0,-6 L 4,0 L 10,-4 L 8,5 Z" />
              <circle cx="-10" cy="-5" r="1.3" />
              <circle cx="0" cy="-7" r="1.3" />
              <circle cx="10" cy="-5" r="1.3" />
            </g>

            {/* =================================================================
                TIER 2: MEDIUM DOODLES (scale 0.85 - 0.95)
                ================================================================= */}
            {/* 7. Plump Kawaii Heart */}
            <g
              transform="translate(125, 44) rotate(20) scale(0.9)"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.7"
              className="stroke-[#f43f5e] dark:stroke-[#fb7185]"
            >
              <path d="M 0,8 C -6,4 -10,-1 -10,-5 C -10,-8 -7,-10 -4,-10 C -1.5,-10 0,-8 0,-6.5 C 0,-8 1.5,-10 4,-10 C 7,-10 10,-8 10,-5 C 10,-1 6,4 0,8 Z" />
            </g>

            {/* 8. Tennis Ball with Curved Seam */}
            <g
              transform="translate(275, 42) rotate(-22) scale(0.9)"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.7"
              className="stroke-[#f59e0b] dark:stroke-[#fbbf24]"
            >
              <circle cx="0" cy="0" r="9" />
              <path d="M -6.36,-6.36 C -2,-2 -2,2 -6.36,6.36 M 6.36,-6.36 C 2,-2 2,2 6.36,6.36" />
            </g>

            {/* 9. Paw-Shaped Heart */}
            <g
              transform="translate(48, 102) rotate(15) scale(0.88)"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.7"
              className="stroke-[#fa4616] dark:stroke-[#ff501c]"
            >
              <path d="M 0,7 C -5,4 -8,0 -8,-3 C -8,-6 -5,-7 -3,-7 C -1,-7 0,-5 0,-4 C 0,-5 1,-7 3,-7 C 5,-7 8,-6 8,-3 C 8,0 5,4 0,7 Z" />
              <circle cx="-7" cy="-7" r="1.8" />
              <circle cx="-2.5" cy="-11" r="1.9" />
              <circle cx="2.5" cy="-11" r="1.9" />
              <circle cx="7" cy="-7" r="1.8" />
            </g>

            {/* 10. Wagging Tail with Joy Motion Lines */}
            <g
              transform="translate(202, 104) rotate(-12) scale(0.9)"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.7"
              className="stroke-[#3e2717] dark:stroke-[#fb923c]"
            >
              <path d="M -8,8 C -3,7 2,2 5,-8 C 7,-4 2,6 -5,11 Z" />
              <path d="M 7,-10 C 9,-8 10,-4 9,-1 M 10,-8 C 12,-6 13,-2 12,1" strokeWidth="1.3" />
            </g>

            {/* 11. Dog Collar with Dangling Heart Tag */}
            <g
              transform="translate(52, 160) rotate(22) scale(0.9)"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.7"
              className="stroke-[#fa4616] dark:stroke-[#ff501c]"
            >
              <path d="M -11,-3 C -6,-1 6,-1 11,-3 C 11,-1 6,1 -11,1 Z" />
              <rect x="-1" y="-4" width="2.5" height="4" rx="0.5" />
              <line x1="0" y1="1" x2="0" y2="4" />
              <path d="M 0,8.5 C -2.5,6.5 -4,4.5 -4,3.2 C -4,1.8 -2,1.8 0,3.2 C 2,1.8 4,1.8 4,3.2 C 4,4.5 2.5,6.5 0,8.5 Z" strokeWidth="1.3" />
            </g>

            {/* 12. Dog Food Dish with Paw Print */}
            <g
              transform="translate(200, 162) rotate(-15) scale(0.9)"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.7"
              className="stroke-[#3e2717] dark:stroke-[#fb923c]"
            >
              <ellipse cx="0" cy="-3" rx="12" ry="2.5" />
              <path d="M -12,-3 L -9,5 L 9,5 L 12,-3" />
              <circle cx="0" cy="1.5" r="1.2" fill="currentColor" />
              <circle cx="-1.5" cy="-0.2" r="0.6" fill="currentColor" />
              <circle cx="1.5" cy="-0.2" r="0.6" fill="currentColor" />
            </g>

            {/* 13. Grooming Ribbon Bow */}
            <g
              transform="translate(122, 210) rotate(18) scale(0.9)"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.7"
              className="stroke-[#f43f5e] dark:stroke-[#fb7185]"
            >
              <circle cx="0" cy="0" r="2" />
              <path d="M -2,0 C -6,-4 -8,-3 -8,0 C -8,3 -6,4 -2,0 Z" />
              <path d="M 2,0 C 6,-4 8,-3 8,0 C 8,3 6,4 2,0 Z" />
              <path d="M -1,2 L -4,7 L -2,6 M 1,2 L 4,7 L 2,6" strokeWidth="1.2" />
            </g>

            {/* 14. Flying Frisbee Disc */}
            <g
              transform="translate(278, 212) rotate(-20) scale(0.9)"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.7"
              className="stroke-[#fa4616] dark:stroke-[#ff501c]"
            >
              <ellipse cx="0" cy="0" rx="13" ry="4.5" />
              <ellipse cx="0" cy="-0.8" rx="8" ry="2.2" strokeWidth="1.2" />
              <path d="M -11,4 C -7,5.5 7,5.5 11,4" strokeDasharray="1.5 2" strokeWidth="1.2" />
            </g>

            {/* 15. Bone with Center Ribbon Bow */}
            <g
              transform="translate(122, 270) rotate(-20) scale(0.88)"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.7"
              className="stroke-[#3e2717] dark:stroke-[#fb923c]"
            >
              <path d="M -9,-2.5 L 9,-2.5 C 9,-5 13,-5 14,-3 C 16,-2 16,0 14,1 C 16,2 16,4 14,5 C 13,7 9,6 9,3.5 L -9,3.5 C -9,6 -13,7 -14,5 C -16,4 -16,2 -14,1 C -16,0 -16,-2 -14,-3 C -13,-5 -9,-5 -9,-2.5 Z" />
              <circle cx="0" cy="0.5" r="1.5" />
              <path d="M -1.5,0.5 C -3,-1 -4,0 -1.5,0.5 Z M 1.5,0.5 C 3,-1 4,0 1.5,0.5 Z" strokeWidth="1.2" />
            </g>

            {/* 16. Speech Bubble with Paw */}
            <g
              transform="translate(278, 272) rotate(16) scale(0.9)"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.7"
              className="stroke-[#fa4616] dark:stroke-[#ff501c]"
            >
              <path d="M -9,-6 C -9,-9 9,-9 9,-6 C 9,-1 5,3 0,3 L -3,6 L -3,3 C -7,3 -9,0 -9,-3 Z" />
              <path d="M 0,-1 C -1.5,-2.5 -2.5,-1 -2.5,-0.2 C -2.5,0.8 0,2 0,2 C 0,2 2.5,0.8 2.5,-0.2 C 2.5,-1 1.5,-2.5 0,-1 Z" strokeWidth="1.2" />
            </g>

            {/* 17. Sleepy Puppy "Zzz" Dream Cloud */}
            <g
              transform="translate(44, 312) rotate(15) scale(0.88)"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.7"
              className="stroke-[#3e2717] dark:stroke-[#fb923c]"
            >
              <path d="M -7,3 C -10,3 -11,0 -9,-2 C -10,-5 -6,-6 -4,-4 C -2,-7 4,-7 6,-4 C 9,-5 11,-2 9,1 C 10,3 8,4 6,4 Z" />
              <path d="M 4,-7 L 7,-7 L 4,-4 L 7,-4" strokeWidth="1.3" />
              <path d="M -1,-9 L 1,-9 L -1,-7 L 1,-7" strokeWidth="1.3" />
            </g>

            {/* 18. Floppy Puppy Ears Silhouette */}
            <g
              transform="translate(202, 314) rotate(-18) scale(0.9)"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.7"
              className="stroke-[#fa4616] dark:stroke-[#ff501c]"
            >
              <path d="M -9,-3 C -14,-4 -15,5 -10,8 C -7,9 -6,3 -6,0" />
              <path d="M 9,-3 C 14,-4 15,5 10,8 C 7,9 6,3 6,0" />
              <path d="M -6,0 C -2,-2 2,-2 6,0" strokeDasharray="1.5 1.5" />
            </g>

            {/* =================================================================
                TIER 3: SMALL FILLERS, SPARKLES & DETAILS (scale 0.55 - 0.70)
                Eliminates empty gaps between larger & medium doodles
                ================================================================= */}
            {/* 19. Kawaii 4-Point Sparkle Star */}
            <g
              transform="translate(82, 70) scale(0.65)"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              className="stroke-[#f59e0b] dark:stroke-[#fbbf24]"
            >
              <path d="M 0,-10 Q 0,-2 8,0 Q 0,2 0,10 Q 0,2 -8,0 Q 0,-2 0,-10 Z" />
            </g>

            {/* 20. Mini Baby Paw Print */}
            <g
              transform="translate(160, 72) rotate(25) scale(0.6)"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              className="stroke-[#fa4616] dark:stroke-[#ff501c]"
            >
              <path d="M -5,1.5 C -5,-2 -1.5,-4 0,-4 C 1.5,-4 5,-2 5,1.5 C 5,5 2,6.5 0,5 C -2,6.5 -5,5 -5,1.5 Z" />
              <circle cx="-5" cy="-5" r="1.5" />
              <circle cx="-1.8" cy="-8" r="1.6" />
              <circle cx="1.8" cy="-8" r="1.6" />
              <circle cx="5" cy="-5" r="1.5" />
            </g>

            {/* 21. Sweet Mini Heart */}
            <g
              transform="translate(242, 74) rotate(-15) scale(0.65)"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              className="stroke-[#f43f5e] dark:stroke-[#fb7185]"
            >
              <path d="M 0,6 C -4,3 -7,0 -7,-3 C -7,-5 -5,-6 -3,-6 C -1,-6 0,-4 0,-3 C 0,-4 1,-6 3,-6 C 5,-6 7,-5 7,-3 C 7,0 4,3 0,6 Z" />
            </g>

            {/* 22. Twin Twinkle Stars */}
            <g
              transform="translate(306, 98) rotate(10) scale(0.6)"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.7"
              className="stroke-[#f59e0b] dark:stroke-[#fbbf24]"
            >
              <path d="M -4,-4 Q -4,0 0,0 Q -4,0 -4,4 Q -4,0 -8,0 Q -4,0 -4,-4 Z" />
              <path d="M 4,2 Q 4,5 7,5 Q 4,5 4,8 Q 4,5 1,5 Q 4,5 4,2 Z" />
            </g>

            {/* 23. Cute Button Nose & Whisker Dots */}
            <g
              transform="translate(86, 132) rotate(-20) scale(0.65)"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              className="stroke-[#3e2717] dark:stroke-[#fb923c]"
            >
              <path d="M 0,2 C -2,0 -3,-2 -3,-3 C -3,-4 -2,-4.5 -1,-4.5 C -0.2,-4.5 0,-4 0,-3.5 C 0,-4 0.2,-4.5 1,-4.5 C 2,-4.5 3,-4 3,-3 C 3,-2 2,0 0,2 Z" />
              <circle cx="-5" cy="1" r="0.7" fill="currentColor" />
              <circle cx="5" cy="1" r="0.7" fill="currentColor" />
            </g>

            {/* 24. Joy Whirly Sparkle Curl */}
            <g
              transform="translate(160, 130) rotate(30) scale(0.65)"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.7"
              className="stroke-[#f59e0b] dark:stroke-[#fbbf24]"
            >
              <path d="M -7,6 C -7,1 -3,-5 3,-5 C 7,-5 8,-1 5,1 C 3,2 0,0 2,-2" />
              <circle cx="8" cy="-8" r="1.4" fill="currentColor" />
            </g>

            {/* 25. Mini Tilted Bone */}
            <g
              transform="translate(242, 134) rotate(-10) scale(0.65)"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              className="stroke-[#3e2717] dark:stroke-[#fb923c]"
            >
              <path d="M -7,-2 L 7,-2 C 7,-4 10,-4 11,-2.5 C 12,-1.5 12,0.5 11,1.5 C 12,2.5 12,4 11,5 C 10,6 7,5 7,3 L -7,3 C -7,5 -10,6 -11,5 C -12,4 -12,2.5 -11,1.5 C -12,0.5 -12,-1.5 -11,-2.5 C -10,-4 -7,-4 -7,-2 Z" />
            </g>

            {/* 26. Mini Floating Heart */}
            <g
              transform="translate(12, 210) rotate(15) scale(0.6)"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              className="stroke-[#f43f5e] dark:stroke-[#fb7185]"
            >
              <path d="M 0,6 C -4,3 -6,0 -6,-2.5 C -6,-4.5 -4,-5.5 -2.5,-5.5 C -1,-5.5 0,-4 0,-3 C 0,-4 1,-5.5 2.5,-5.5 C 4,-5.5 6,-4.5 6,-2.5 C 6,0 4,3 0,6 Z" />
            </g>

            {/* 27. Twin Companion Hearts */}
            <g
              transform="translate(84, 238) rotate(-25) scale(0.65)"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.7"
              className="stroke-[#fa4616] dark:stroke-[#ff501c]"
            >
              <path d="M -3,6 C -7,3 -10,-1 -10,-4 C -10,-7 -7,-8 -5,-8 C -3,-8 -2,-7 -2,-5 C -2,-7 -1,-8 1,-8 C 3,-8 6,-7 6,-4 C 6,-1 2,3 -3,6 Z" />
              <path d="M 5,3 C 4,1.5 3,0 3,-1.5 C 3,-3 4,-3.5 5,-3.5 C 5.5,-3.5 6,-3 6,-2.5 C 6,-3 6.5,-3.5 7,-3.5 C 8,-3.5 9,-3 9,-1.5 C 9,0 7,1.5 5,3 Z" strokeWidth="1.2" />
            </g>

            {/* 28. Playful Toe Beans Cluster */}
            <g
              transform="translate(162, 236) rotate(15) scale(0.6)"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.7"
              className="stroke-[#fa4616] dark:stroke-[#ff501c]"
            >
              <circle cx="-4" cy="2" r="2.2" fill="currentColor" />
              <circle cx="4" cy="2" r="2.2" fill="currentColor" />
              <circle cx="0" cy="-4" r="2.6" fill="currentColor" />
            </g>

            {/* 29. Mini Crown Accent */}
            <g
              transform="translate(242, 240) rotate(-15) scale(0.65)"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.7"
              className="stroke-[#f59e0b] dark:stroke-[#fbbf24]"
            >
              <path d="M -6,4 L -7,-2 L -3,1 L 0,-4 L 3,1 L 7,-2 L 6,4 Z" />
              <circle cx="-7" cy="-3" r="0.9" />
              <circle cx="0" cy="-5" r="0.9" />
              <circle cx="7" cy="-3" r="0.9" />
            </g>

            {/* 30. Diamond Twinkle */}
            <g
              transform="translate(308, 242) rotate(20) scale(0.6)"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              className="stroke-[#f43f5e] dark:stroke-[#fb7185]"
            >
              <path d="M 0,-8 Q 0,-1.5 6,0 Q 0,1.5 0,8 Q 0,1.5 -6,0 Q 0,-1.5 0,-8 Z" />
            </g>

            {/* 31. Mini Paw Stamp */}
            <g
              transform="translate(84, 298) rotate(10) scale(0.65)"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              className="stroke-[#fa4616] dark:stroke-[#ff501c]"
            >
              <path d="M -5,1.5 C -5,-2 -1.5,-4 0,-4 C 1.5,-4 5,-2 5,1.5 C 5,5 2,6.5 0,5 C -2,6.5 -5,5 -5,1.5 Z" />
              <circle cx="-5" cy="-5" r="1.3" />
              <circle cx="0" cy="-7.5" r="1.4" />
              <circle cx="5" cy="-5" r="1.3" />
            </g>

            {/* 32. Cute Ribbon Mini Knot */}
            <g
              transform="translate(162, 296) rotate(-20) scale(0.6)"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.7"
              className="stroke-[#f43f5e] dark:stroke-[#fb7185]"
            >
              <circle cx="0" cy="0" r="1.5" />
              <path d="M -1.5,0 C -5,-3 -6,-2 -6,0 C -6,2 -5,3 -1.5,0 Z" />
              <path d="M 1.5,0 C 5,-3 6,-2 6,0 C 6,2 5,3 1.5,0 Z" />
            </g>

            {/* 33. Mini Tennis Ball */}
            <g
              transform="translate(242, 298) rotate(25) scale(0.65)"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.7"
              className="stroke-[#f59e0b] dark:stroke-[#fbbf24]"
            >
              <circle cx="0" cy="0" r="6.5" />
              <path d="M -4.5,-4.5 C -1.5,-1.5 -1.5,1.5 -4.5,4.5 M 4.5,-4.5 C 1.5,-1.5 1.5,1.5 4.5,4.5" />
            </g>

            {/* 34. Sweet Double Twinkle */}
            <g
              transform="translate(306, 308) rotate(-10) scale(0.6)"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.7"
              className="stroke-[#fa4616] dark:stroke-[#ff501c]"
            >
              <path d="M -3,-3 Q -3,0 0,0 Q -3,0 -3,3 Q -3,0 -6,0 Q -3,0 -3,-3 Z" />
              <path d="M 3,1 Q 3,3.5 5.5,3.5 Q 3,3.5 3,6 Q 3,3.5 0.5,3.5 Q 3,3.5 3,1 Z" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#woofskis-about-doodles)" />
      </svg>
    </div>
  );
}
