# Implementation Plan - Leader Image Cropping Fix

## Goal Description

Fix the issue where both the Base and Awakened forms of the Leader are visible simultaneously. We will change the image rendering logic to explicitly zoom into one half of the image.

## Proposed Changes

### Components

#### [MODIFY] [Card.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/Card.tsx)

- Update the Leader image rendering logic:
  - Instead of `w-full h-full object-cover`, use a more explicit sizing for Leaders.
  - Apply `h-[200%] w-full absolute` to the `img` tag when `type === 'LEADER'`.
  - Set `top-0` when `!isAwakened`.
  - Set `bottom-0` when `isAwakened`.
  - Keep the container `overflow-hidden`.
  - This guarantees that the image is exactly twice as tall as the visible area, and the software "crops" it by overflow.

## Verification Plan

- **Manual**:
    1. Confirm that only the top half of the artwork is visible for a non-awakened Leader.
    2. Confirm that only the bottom half of the artwork is visible for an awakened Leader.
    3. Verify that no overlap occurs between the two forms.
