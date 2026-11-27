// /template: a playground page where you put your reusable components
// together. Open http://localhost:3000/template while `npm run dev` runs.
//
// This page has no "use client", so it is a Server Component. That's fine:
// it can still render Client Components (Tabs, Toggle, ...). It just can't
// use useState or pass functions like onClick/onSelect itself.
// If you need that, make a small client wrapper component.

import Tabs from "@/components/test/Tabs/Tabs";
import Toggle from "@/components/test/Toggle/Toggle";
import Dropdown from "@/components/test/Dropdown/Dropdown";
import Carousel from "@/components/test/Carousel/Carousel";
import IconButton from "@/components/test/IconButton/IconButton";
import Badge from "@/components/test/Badge/Badge";
import styles from "./template.module.css";

export default function TemplatePage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Component Template</h1>

      {/* TODO: this is just a test bench. Replace it with your own layout
          (header, cards, sidebar...) and use the components inside it. */}

      <section className={styles.section}>
        <h2>Badge</h2>
        <Badge>Default</Badge>
        <Badge variant="success">Trending</Badge>
        <Badge variant="warning">Falling</Badge>
      </section>

      <section className={styles.section}>
        <h2>Icon Buttons</h2>
        <IconButton icon="edit" label="Edit" />
        <IconButton icon="copy" label="Copy" />
        <IconButton icon="trash" label="Delete" />
      </section>

      <section className={styles.section}>
        <h2>Toggle</h2>
        <Toggle label="Email alerts" />
        <Toggle label="Weekly report" defaultChecked />
      </section>

      <section className={styles.section}>
        <h2>Dropdown</h2>
        <Dropdown label="Choose a platform" options={["Instagram", "TikTok", "LinkedIn"]} />
      </section>

      <section className={styles.section}>
        <h2>Tabs</h2>
        <Tabs
          tabs={[
            { id: "overview", label: "Overview", content: <p>Overview content</p> },
            { id: "trends", label: "Trends", content: <p>Trends content</p> },
            { id: "reports", label: "Reports", content: <p>Reports content</p> },
          ]}
        />
      </section>

      <section className={styles.section}>
        <h2>Carousel</h2>
        <Carousel
          slides={[
            <div key="1">Slide 1</div>,
            <div key="2">Slide 2</div>,
            <div key="3">Slide 3</div>,
          ]}
        />
      </section>
    </main>
  );
}
