### **A Writer's Guide to Scripting in the HK2085 Engine**

Welcome! This guide will teach you how to write stories for our game engine. Think of yourself as a film director, a playwright, and a novelist all in one. You'll be controlling everything from what the player sees and hears to the choices they make.

Our scripts are written in a simple, text-based format called **YAML**. It uses indentation (spaces) to structure information, making it easy to read and write.

#### **1. The Building Block: The "Step"**

Your entire story is a sequence of "steps." Each step is a single moment in the game—a line of dialogue, a scene change, a player choice, etc.

Every step has two mandatory parts:
*   `stepId`: A unique number or name for that step.
*   `type`: What kind of step it is (e.g., `dialogue`).

Here is the most basic step possible:
```yaml
- stepId: 1
  type: dialogue
  text: "Hello, world!"
  nextStep: 2 # Tells the engine where to go next
```

The `-` at the beginning is important; it marks the start of a new step.

---

#### **2. Crafting a Scene: The `dialogue` Step**

The `dialogue` step is the heart of your visual novel. While its name is "dialogue," it's really a "scene" step. It controls the background, characters, music, and text all at once.

Let's break down a complete `dialogue` step:

```yaml
- stepId: 10
  type: dialogue
  
  # --- Visuals & Audio ---
  image: /assets/images/scenes/protagonist_room.jpg  # Background Image
  bgm: /assets/audio/music/protagonist_theme.mp3     # Background Music (BGM)
  audio: /assets/audio/voice/echo_line_10.mp3        # Character Voice-over
  
  # --- Characters on Screen ---
  characters:
    - id: Echo
      sprite: /assets/images/sprites/echo_neutral.png
      position: center
  
  # --- Dialogue Text ---
  persona: Echo      # Who is speaking?
  text: "The fractured moon seeks its reflection in the water."
  
  # --- Navigation ---
  nextStep: 11
```

Let's go through each field:

*   **`image`**: This is the **background image** for the scene. You need to provide the full path to the image file, starting from `/assets/`.
*   **`bgm`**: The **background music**. This music will start playing and will **loop** continuously until you change it in a later step.
    *   To **stop** the music, set `bgm: null` in a future step.
    *   If you don't mention `bgm` in the next step, the current music will keep playing.
*   **`audio`**: The **voice-over** for the current line of dialogue. This is a one-time sound effect that plays alongside the text.
*   **`characters`**: A list of all characters currently visible on screen. This is where you control the character art (sprites).
    *   `id`: The character's unique name (must match an ID from `personaData.js`).
    *   `sprite`: The path to the character's image file.
    *   `position`: Where the character stands. Common values are `left`, `center`, and `right`.
*   **`persona`**: The ID of the character who is currently **speaking**. The game will highlight this character and display their name in the dialogue box.
*   **`text`**: The actual line of dialogue that the player reads.
*   **`nextStep`**: The `stepId` of the very next step to happen after the player clicks to continue.

**Example: A two-person conversation**

```yaml
- stepId: 11
  type: dialogue
  image: /assets/images/scenes/tea_shop.jpg
  # bgm is not mentioned, so the previous music continues.
  
  characters:
    - id: Player
      sprite: /assets/images/sprites/player_neutral.png
      position: left
    - id: AhMing
      sprite: /assets/images/sprites/ahming_talking.png
      position: right
      
  persona: AhMing
  text: "Hey, Ah Qiang! Long time no see!"
  nextStep: 12
  
- stepId: 12
  type: dialogue
  image: /assets/images/scenes/tea_shop.jpg # Background stays the same
  
  characters: # Character list must be repeated to keep them on screen
    - id: Player
      sprite: /assets/images/sprites/player_confused.png # You can change the sprite!
      position: left
    - id: AhMing
      sprite: /assets/images/sprites/ahming_neutral.png
      position: right
      
  persona: Player
  text: "You are...? Sorry, I don't seem to remember."
  nextStep: 13
```

**Key Takeaway:** Each `dialogue` step is a complete snapshot of the scene. You must define everything you want the player to see and hear at that moment.

---

#### **3. Giving the Player Agency: The `choices` Field**

This is how you create branching narratives. When you want the player to make a decision, you add a `choices` list to a `dialogue` step.

When `choices` is present, the `nextStep` field is **ignored**. The story will only proceed after the player clicks one of the choice buttons.

```yaml
- stepId: 50
  type: dialogue
  persona: AhMing
  image: /assets/images/scenes/tea_shop.jpg
  characters:
    - id: AhMing
      sprite: /assets/images/sprites/ahming_worried.png
      position: center
  text: "I really don't know what to do... This tea shop... should I keep fighting for it?"
  
  # Add the 'choices' list
  choices:
    - text: "You should keep fighting for your grandma." # Text displayed on the button
      nextStep: 51 # The stepId to jump to if this choice is picked
      
    - text: "Maybe it's time to let go."
      nextStep: 52
      
    - text: "[Investigate] Tell me more about the developers."
      nextStep: 60
```

*   **`text`**: The text that appears on the choice button.
*   **`nextStep`**: The `stepId` the game will jump to when the player clicks this button. This is how you create different story paths.

The game will automatically pause and display these options to the player.

---

#### **4. Manipulating the Game World: Other Step Types**

Besides `dialogue`, there are a few other powerful step types for controlling the game's logic behind the scenes.

*   **`updateWorldState`**: Change a piece of information in the game's memory.
    *   **Example:** Making a new character available for chat.
        ```yaml
        - stepId: 100
          type: updateWorldState
          target: persona
          id: "Kiera"
          property: requiresChatWindow
          value: true
          nextStep: 101
        ```

*   **`UNLOCK_CLUE`**: Give the player a new clue, which appears in their clue log.
    *   **Example:** The player finds a note.
        ```yaml
        - stepId: 102
          type: UNLOCK_CLUE
          clueId: mingTak_note01 # This ID must be defined in cluesDatabase.js
          nextStep: 103
        ```

*   **`ACTIVATE_PUZZLE`**: Start a new puzzle for the player to solve.
    *   **Example:** Activating a code-entry puzzle.
        ```yaml
        - stepId: 104
          type: ACTIVATE_PUZZLE
          puzzleId: "mingTakCodeEntry" # This ID must be defined in puzzlesDatabase.js
          nextStep: 105
        ```

*   **`WAIT_FOR_PUZZLE_SOLVED`**: Pause the script until a specific puzzle is solved.
    *   **Example:** A door is locked until a puzzle is completed.
        ```yaml
        - stepId: 105
          type: WAIT_FOR_PUZZLE_SOLVED
          puzzleId: "mingTakCodeEntry"
          nextStep: 106 # Where to go AFTER the puzzle is solved
        ```

#### **5. Scripting Best Practices for Writers**

1.  **Plan Your Flow:** Before writing, sketch out your scene flow on paper or in a simple flowchart. Know your `stepId`s and how they connect.
2.  **Use Comments:** Use the `#` symbol to leave notes for yourself or other writers. The engine will ignore these.
    ```yaml
    # This is the start of Chapter 2
    - stepId: 200
      type: dialogue
      ...
    ```
3.  **Indent Carefully:** YAML is very strict about indentation. Use two spaces for each level of nesting. Do not use the Tab key.
4.  **Manage Your Assets:** Keep your image and audio files organized in the `/assets/` subfolders. Use clear, consistent naming.
5.  **Test As You Write:** After writing a few steps, save the file and run the game. It's much easier to find mistakes in a small section than in a huge script.

You now have all the tools you need to build compelling, interactive, and visually rich scenes. Happy writing
