# Missing Asset Generation Guide

This document provides detailed prompts and filenames for generating the required art assets for the game script `HK_2085_Love_Isaac.yaml`.

---

## 1. Backgrounds

### 1.1. Protagonist's Room
- **Filename:** `protagonist_room_interior.png`
- **Prompt:** `A small, cluttered room in a futuristic cyberpunk slum, window showing a dilapidated cityscape with glowing neon signs, moody lighting, cinematic, detailed, anime art style.`
- **Notes:** This should feel like a personal, cramped living space, contrasting with the vast city outside. Corresponds to `stepId: wake_up0`.

### 1.2. Tea Store Interior
- **Filename:** `tea_store_interior.png`
- **Prompt:** `Interior of a traditional Chinese herbal tea shop, dimly lit, old wooden furniture, walls lined with shelves of herb jars, a sense of history and warmth, cyberpunk elements subtly integrated, anime art style.`
- **Notes:** The current `tea_store.png` is an exterior shot. We need an interior view. Corresponds to `stepId: 80`.

### 1.3. Abandoned Warehouse
- **Filename:** `abandoned_warehouse_interior.png`
- **Prompt:** `Interior of a dark, derelict warehouse, shafts of light breaking through holes in the roof, dust particles floating in the air, cluttered with old machinery and junk, tense atmosphere, anime art style.`
- **Notes:** For the scene where the protagonist and AhMing hide. Corresponds to `stepId: 124`.

### 1.4. Food Waste Power Station
- **Filename:** `food_waste_power_station.png`
- **Prompt:** `A grimy, industrial food waste power station, complex network of pipes and tanks, conveyor belts, steam and faint, unpleasant light, cyberpunk, dystopian, anime art style.`
- **Notes:** Needs to look more distinct and thematic. Corresponds to `stepId: dump_30`.

### 1.5. Dilapidated Playground
- **Filename:** `dilapidated_playground.png`
- **Prompt:** `A desolate, abandoned playground in a post-apocalyptic city, rusty swings and slides, overgrown with weeds, eerie and melancholic atmosphere, cinematic, anime art style.`
- **Notes:** To unify the puzzle scenes in this location. Corresponds to `stepId: dump_32`.

---

## 2. Character Sprites

### 2.1. AhMing (Multiple Expressions)
- **Base Style:** Young Asian man, simple, slightly worn-out cyberpunk attire.
- **Sad/Desperate:**
    - **Filename:** `ahming_sprite_sad.png`
    - **Prompt:** `Character sprite of a young Asian man, looking desperate and sad, on the verge of tears, cyberpunk attire, transparent background, anime art style.`
- **Happy/Satisfied:**
    - **Filename:** `ahming_sprite_happy.png`
    - **Prompt:** `Character sprite of a young Asian man, with a warm, satisfied smile, a moment of happiness, cyberpunk attire, transparent background, anime art style.`
- **Nervous:**
    - **Filename:** `ahming_sprite_nervous.png`
    - **Prompt:** `Character sprite of a young Asian man, looking nervous and tense, glancing around worriedly, cyberpunk attire, transparent background, anime art style.`

### 2.2. Player (Multiple Expressions)
- **Base Style:** Young man, determined but weary look, simple cyberpunk clothing.
- **Thinking/Confused:**
    - **Filename:** `protagonist_sprite_thinking.png`
    - **Prompt:** `Character sprite of the male protagonist, with a confused and thoughtful expression, trying to piece things together, cyberpunk style, transparent background, anime art style.`
- **Vigilant:**
    - **Filename:** `protagonist_sprite_vigilant.png`
    - **Prompt:** `Character sprite of the male protagonist, with a vigilant and cautious expression, alert and ready for danger, cyberpunk style, transparent background, anime art style.`
- **Empathetic/Sad:**
    - **Filename:** `protagonist_sprite_empathetic.png`
    - **Prompt:** `Character sprite of the male protagonist, with a sad and empathetic expression, showing compassion, cyberpunk style, transparent background, anime art style.`

### 2.3. Kiera (Multiple Outfits/Expressions)
- **Base Style:** Beautiful young Asian woman, influencer aesthetic.
- **Livestreaming Outfit:**
    - **Filename:** `kiera_sprite_livestream.png`
    - **Prompt:** `Character sprite of Kiera, a beautiful young Asian woman, in a stylish, futuristic outfit for live-streaming, bright professional smile, perfect makeup, cyberpunk influencer, transparent background, anime art style.`
- **Casual/Tired Outfit:**
    - **Filename:** `kiera_sprite_casual.png`
    - **Prompt:** `Character sprite of Kiera, a beautiful young Asian woman, in simple casual clothes, looking tired and vulnerable, without her public smile, showing a hint of sadness, transparent background, anime art style.`

---

## 3. Key Items

### 3.1. Cartoon Cabinet
- **Filename:** `item_cartoon_cabinet.png`
- **Prompt:** `Close-up illustration of a worn-out children's cabinet found in a junkyard, faded cartoon characters painted on it, a sense of lost childhood and nostalgia, detailed, cinematic, anime art style.`
- **Notes:** This is a key item for a puzzle/memory sequence. Corresponds to `stepId: dump_12`.