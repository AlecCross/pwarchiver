import type { Metadata } from "next";
import ArchiveCreator from "./components/ArchiceCreator";
import ArchiveUnzipper from "./components/ArchiveUnzipper";

export const metadata: Metadata = {
  title: "PWArchiver",
};

export default function Page() {
  return (
    <>
      <h1>Next.js + Serwist</h1>
      <ArchiveCreator/>
      <ArchiveUnzipper/>
    </>
  );
}
