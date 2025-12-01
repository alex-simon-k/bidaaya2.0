# StreakMaster Dashboard - Migration & Implementation Guide

This guide details how to migrate the "Cyber-Glass" 3D Streak Dashboard into your existing React application.

## 1. Design Philosophy
The design relies on three core pillars:
1.  **Glassmorphism**: High transparency (`opacity-60`, `bg-slate-900/50`), subtle borders (`border-white/10`), and background blurs.
2.  **Neon Accents**: Using specific Tailwind colors (`indigo-500`, `cyan-400`, `fuchsia-400`) to create a "glow" effect against the dark `slate-950` background.
3.  **Isometric 3D**: CSS 3D transforms to turn a standard bar chart into a "cityscape" visualization.

## 2. Dependencies

Ensure your project has the following installed:

*   **React**: v18+
*   **Tailwind CSS**: v3.0+ (Crucial for the arbitrary value syntax like `w-[800px]`)
*   **Lucide React**: For the icons (`Flame`, `Eye`, `Zap`, etc.)
    ```bash
    npm install lucide-react
    ```
*   **clsx / tailwind-merge** (Optional but recommended for conditional class names):
    ```bash
    npm install clsx tailwind-merge
    ```

## 3. Data Structure (Backend Requirements)

To make this dynamic, your backend API needs to provide a data shape similar to this. 

**TypeScript Interface:**

```typescript
// types.ts

export enum VisibilityTier {
  INVISIBLE = 'Invisible',
  VISIBLE = 'Visible',
  RISING_STAR = 'Rising Star',
  TOP_TALENT = 'Top Talent'
}

export interface DailyPick {
  id: string;
  role: string;     // e.g. "Frontend Engineer"
  company: string;  // e.g. "Vercel"
  logo: string;     // URL or Initial char
  applied: boolean; // Has the user applied today?
}

export interface UserStreakData {
  currentStreak: number;      // e.g. 12
  totalApplications: number;  // Cumulative total e.g. 142
  
  // Array of integers representing activity for the last 28 days.
  // 0 = no activity, 1 = low, 2 = medium, 3+ = high
  // Index 0 is 28 days ago, Index 27 is Today.
  history: number[]; 
  
  dailyPicks: DailyPick[];    // The list of jobs to show
}
```

## 4. The 3D Heatmap Logic (`IsometricHeatmap.tsx`)

This is the most complex visual component. It uses CSS `transform` to fake a 3D view.

**Key Implementation Details:**

1.  **The Container Transform:**
    The grid container must have this inline style to tilt the entire plane:
    ```css
    transform: perspective(800px) rotateX(60deg) rotateZ(45deg);
    transform-style: preserve-3d;
    ```

2.  **The Bar Height (Z-Index equivalent):**
    We translate the bars on the Z-axis based on their value.
    ```javascript
    // Calculate how "tall" the bar is (0 to 100px max)
    const heightPercent = (value / maxValue) * 100; 
    
    // Style applied to the bar div
    style={{ transform: `translateZ(${heightPercent / 2}px)` }}
    ```

3.  **The Shadow:**
    To sell the effect, every bar needs a shadow that moves based on the height.
    ```css
    box-shadow: -4px 4px 8px rgba(0,0,0,0.5);
    ```

## 5. The Visibility Logic (`StreakCard.tsx`)

You likely have existing logic for this on your backend, but here is the frontend logic used in the design to replicate the "Multiplier" effect.

**Formula:**
`Multiplier = Base (1.0) + (Current Streak * 0.15)`

**Tier Thresholds:**
*   **Streak < 3:** Invisible
*   **Streak 3-9:** Visible
*   **Streak 10-19:** Rising Star (Cyan Glow)
*   **Streak 20+:** Top Talent (Fuchsia Glow)

**Migration Step:**
Ensure your `StreakCard` component subscribes to your user data context or accepts these values as props, rather than using the local `useState` mock data found in the prototype.

## 6. Color Palette (Tailwind)

The design strictly uses the **Slate** scale for neutrals and **Indigo/Cyan/Fuchsia** for accents.

*   **Background:** `bg-slate-950` (Very dark blue-grey)
*   **Card BG:** `bg-slate-900`
*   **Borders:** `border-slate-800`
*   **Primary Action:** `indigo-600` (Hover: `indigo-500`)
*   **Success:** `emerald-500`

## 7. Migration Checklist

1.  [ ] **Copy Components**: Move `StreakCard.tsx` and `IsometricHeatmap.tsx` into your `src/components` folder.
2.  [ ] **Install Icons**: Ensure `lucide-react` is installed.
3.  [ ] **Connect Data**: 
    *   Open `StreakCard.tsx`.
    *   Remove the `useState` with mock data.
    *   Replace it with your `useQuery` (TanStack Query) or Redux selector.
    *   Map your real backend data to the `StreakState` interface.
4.  [ ] **Handle Actions**:
    *   Replace the `handleApply` function with your actual API mutation (e.g., `applyToJob(id)`).
    *   Ensure applying optimistically updates the local UI (sets `applied: true`) for instant feedback.
5.  [ ] **Global Styles**:
    *   Ensure your global `body` or main wrapper has `bg-slate-950` or a similar dark background, otherwise the transparency effects will look washed out.

## 8. Troubleshooting

*   **"The 3D bars look flat"**: Check if the parent container has `overflow: hidden` cutting off the Z-axis, or if the `transform-style: preserve-3d` is missing.
*   **"Glows aren't glowing"**: Tailwind's `shadow-[...]` arbitrary values require JIT mode (enabled by default in v3+). If using an older version, configure `tailwind.config.js` to include the specific shadow colors.
*   **"Mobile layout breaks"**: The `IsometricHeatmap` is grid-based. Ensure the container has enough width or scales down using `transform: scale(...)` on very small screens if necessary.
