"use client";
import { useState } from 'react';
import JSZip from 'jszip';
import styles from '../styles/ArchiveTools.module.css';

interface UnzippedFile {
  name: string;
  url: string; // URL для скачування конкретного файлу
  blob: Blob; // Зберігаємо сам Blob, щоб не робити зайвих HTTP-запитів при перепакуванні
}

const ArchiveUnzipper = () => {
  const [selectedZipFile, setSelectedZipFile] = useState<File | null>(null);
  const [unzippedFiles, setUnzippedFiles] = useState<UnzippedFile[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFilesToDownload, setSelectedFilesToDownload] = useState<string[]>([]); // Новий стан для обраних файлів
  const [isDownloadingIndividual, setIsDownloadingIndividual] = useState<boolean>(false); // Стан для відключення кнопки під час індивідуального завантаження

  const handleZipFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedZipFile(event.target.files?.[0] || null);
    setUnzippedFiles([]);
    setErrorMessage(null);
    setSelectedFilesToDownload([]); // Очищаємо обрані файли при зміні архіву
  };

  const handleUnzip = async () => {
    if (!selectedZipFile) {
      setErrorMessage('Будь ласка, виберіть ZIP-архів для розархівації.');
      return;
    }

    setErrorMessage(null);
    setUnzippedFiles([]); // Очищаємо попередні файли
    setSelectedFilesToDownload([]); // Очищаємо попередній вибір

    try {
      const zip = await JSZip.loadAsync(selectedZipFile);
      const files: UnzippedFile[] = [];

      for (const fileName in zip.files) {
        if (!zip.files[fileName].dir) {
          try {
            const blob = await zip.file(fileName)?.async('blob');
            if (blob) {
              const url = URL.createObjectURL(blob);
              files.push({ name: fileName, url, blob: blob }); // Зберігаємо і blob
            }
          } catch (fileError: any) {
            console.error(`Помилка при розпакуванні файлу "${fileName}":`, fileError);
            if (fileError.message && fileError.message.includes('corrupted zip')) {
              setErrorMessage('Файл пошкоджено, або використовується метод шифрування, який не підтримується.');
              return; // Зупиняємо процес розархівації
            } else {
              setErrorMessage(`Виникла помилка при розпакуванні файлу "${fileName}": ${fileError.message}.`);
              return; // Зупиняємо процес
            }
          }
        }
      }
      setUnzippedFiles(files);

    } catch (archiveError: any) {
      console.error('Помилка при завантаженні/розархівації архіву:', archiveError);
      if (archiveError.message && archiveError.message.includes('Encrypted zip are not supported')) {
        setErrorMessage('Зашифровані ZIP-архіви з повністю зашифрованими заголовками/метаданими не підтримуються.');
      } else if (archiveError.message && (archiveError.message.includes('Corrupted zip') || archiveError.message.includes('unknown file type'))) {
        setErrorMessage('Недійсний або пошкоджений ZIP-архів.');
      } else {
        setErrorMessage('Виникла невідома помилка при розархівації архіву. Можливо, файл пошкоджено.');
      }
    }
  };

  // Обробник для чекбоксів окремих файлів
  const handleFileSelect = (fileName: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedFilesToDownload((prev) => [...prev, fileName]);
    } else {
      setSelectedFilesToDownload((prev) => prev.filter((name) => name !== fileName));
    }
  };

  // Обробник для чекбоксу "Вибрати все"
  const handleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
      setSelectedFilesToDownload(unzippedFiles.map((file) => file.name));
    } else {
      setSelectedFilesToDownload([]);
    }
  };

  // НОВА ФУНКЦІЯ: Завантаження обраних файлів як ОДНОГО ZIP-архіву
  const handleDownloadSelectedAsZip = async () => {
    if (selectedFilesToDownload.length === 0) {
      alert('Будь ласка, виберіть файли для завантаження.');
      return;
    }

    const zipToDownload = new JSZip();
    selectedFilesToDownload.forEach((fileName) => {
      const file = unzippedFiles.find((f) => f.name === fileName);
      if (file) {
        zipToDownload.file(file.name, file.blob); // Додаємо Blob до нового ZIP
      }
    });

    try {
      const blob = await zipToDownload.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'selected_files.zip'; // Ім'я нового архіву
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url); // Звільняємо URL
    } catch (error) {
      console.error('Помилка при створенні архіву обраних файлів:', error);
      setErrorMessage('Виникла помилка при завантаженні обраних файлів як ZIP.');
    } finally {
        setSelectedFilesToDownload([]); // Очистити вибір після завантаження ZIP
    }
  };

  // НОВА ФУНКЦІЯ: Завантаження обраних файлів ОКРЕМО
  const handleDownloadSelectedIndividually = async () => {
    if (selectedFilesToDownload.length === 0) {
      alert('Будь ласка, виберіть файли для завантаження.');
      return;
    }

    // Попередження для користувача
    if (selectedFilesToDownload.length > 3) { // Зменшимо поріг для попередження
      const confirmDownload = confirm(
        `Ви збираєтеся завантажити ${selectedFilesToDownload.length} окремих файлів. Ваш браузер може запитати дозвіл або заблокувати деякі завантаження. Продовжити?`
      );
      if (!confirmDownload) {
        return;
      }
    }

    setIsDownloadingIndividual(true); // Встановлюємо, що завантажуємо індивідуально
    setErrorMessage(null); // Очищаємо помилки

    for (const fileName of selectedFilesToDownload) {
      const file = unzippedFiles.find((f) => f.name === fileName);
      if (file) {
        try {
          const a = document.createElement('a');
          a.href = file.url;
          a.download = file.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          // Невелика затримка, щоб уникнути блокування браузером
          await new Promise(resolve => setTimeout(resolve, 50)); // 50 мс затримки
        } catch (error) {
          console.error(`Помилка при завантаженні файлу "${fileName}" окремо:`, error);
          setErrorMessage(`Виникла помилка при завантаженні файлу "${fileName}".`);
          break; // Зупинити цикл при помилці
        }
      }
    }
    setIsDownloadingIndividual(false); // Завершили завантаження
    setSelectedFilesToDownload([]); // Очистити вибір після завантаження
  };


  return (
    <div className={styles.section}>
      <h2>Розархівувати ZIP-архів</h2>
      <div className={styles.inputGroup}>
        <input type="file" accept=".zip" onChange={handleZipFileChange} style={{ display: 'none' }} id="unzipFile" />
        <label htmlFor="unzipFile" className={styles.inputButton}>Вибрати ZIP-архів</label>
        <span className={styles.fileLabel}>{selectedZipFile?.name || 'Файл не обрано'}</span>
        <button onClick={handleUnzip} disabled={!selectedZipFile} className={styles.inputButton}>
          Розархівувати
        </button>
      </div>

      {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}

      {unzippedFiles.length > 0 && (
        <div>
          <h3>Розпаковані файли:</h3>
          <div className={styles.downloadControls}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                onChange={(e) => handleSelectAll(e.target.checked)}
                checked={selectedFilesToDownload.length === unzippedFiles.length && unzippedFiles.length > 0}
              />
              Вибрати все
            </label>
            {/* Кнопка для завантаження в ZIP */}
            <button
              onClick={handleDownloadSelectedAsZip}
              disabled={selectedFilesToDownload.length === 0 || isDownloadingIndividual}
              className={styles.inputButton}
            >
              Завантажити обрані як ZIP ({selectedFilesToDownload.length})
            </button>
            {/* Кнопка для завантаження окремо */}
            <button
              onClick={handleDownloadSelectedIndividually}
              disabled={selectedFilesToDownload.length === 0 || isDownloadingIndividual}
              className={styles.inputButton}
              style={{ backgroundColor: '#28a745' }} // Інший колір, щоб візуально розрізняти
            >
              Завантажити обрані окремо ({selectedFilesToDownload.length})
            </button>
          </div>
          <ul className={styles.unzippedFilesList}>
            {unzippedFiles.map((file) => (
              <li key={file.name} className={styles.unzippedFileItem}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedFilesToDownload.includes(file.name)}
                    onChange={(e) => handleFileSelect(file.name, e.target.checked)}
                  />
                  <a href={file.url} download={file.name} className={styles.downloadLink}>
                    {file.name}
                  </a>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ArchiveUnzipper;
