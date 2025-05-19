import type { Metadata } from "next";
import ArchiveCreator from "./components/ArchiceCreator";
import ArchiveUnzipper from "./components/ArchiveUnzipper";
import styles from './styles/ArchiveTools.module.css';

export const metadata: Metadata = {
  title: "PWArchiver",
};

export default function Page() {
  return (
    <main className={styles.container}>
      <h1>PWArchiver</h1>
      <ArchiveCreator />
      <ArchiveUnzipper />
    </main>
  );
}
