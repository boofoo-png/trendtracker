"use client";
// Carousel: shows one slide at a time with previous / next buttons.
//
// Usage:
//   <Carousel slides={[<div>Slide 1</div>, <div>Slide 2</div>]} />

import { useState } from "react";
import IconButton from "../IconButton/IconButton";
import styles from "./Carousel.module.css";

export default function Carousel({ slides = [] }) {
  const [index, setIndex] = useState(0);

  function next() {
    // TODO: go to the next slide. What happens after the last one?
    // Hint: (index + 1) % slides.length wraps back to 0.
  }

  function prev() {
    // TODO: go to the previous slide (and wrap to the end).
  }

  return (
    <div className={styles.carousel}>
      <div className={styles.viewport}>
        {/* Option A: render only slides[index].
            Option B: render all slides in a row and slide them with
            style={{ transform: `translateX(-${index * 100}%)` }} */}
        {slides[index]}
      </div>

      {/* Reusing our own IconButton component! */}
      <div className={styles.controls}>
        <IconButton icon="chevron" label="Previous slide" onClick={prev} />
        <span>
          {index + 1} / {slides.length}
        </span>
        <IconButton icon="chevron" label="Next slide" onClick={next} />
      </div>

      {/* Stretch goal: dots under the carousel to jump to a slide. */}
    </div>
  );
}
