"use client";
import { useState, useRef } from 'react';
import JSZip from 'jszip';

const ArchiveCreator = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

  const handleArchive = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      alert('Будь ласка, виберіть файли для архівування.');
      return;
    }

    const zip = new JSZip();
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      zip.file(file.name, file);
    }

    try {
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
    } catch (error) {
      console.error('Помилка при створенні архіву:', error);
      alert('Виникла помилка при створенні архіву.');
    }
  };

  return (
    <div>
      <h2>Створити ZIP-архів</h2>
      <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} />
      <button onClick={handleArchive} disabled={!selectedFiles || selectedFiles.length === 0}>
        Заархівувати
      </button>
      {downloadUrl && (
        <p>
          <a href={downloadUrl} download="archive.zip">
            Завантажити архів
          </a>
        </p>
      )}
    </div>
  );
};

export default ArchiveCreator;
