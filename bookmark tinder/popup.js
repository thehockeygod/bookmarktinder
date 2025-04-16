document.addEventListener('DOMContentLoaded', () => {
    const folderSelect = document.getElementById('folderSelect');
    const bookmarkTitle = document.getElementById('bookmarkTitle');
    const bookmarkUrl = document.getElementById('bookmarkUrl');
    const deleteButton = document.getElementById('deleteButton');
    const keepButton = document.getElementById('keepButton');
    const moveButton = document.getElementById('moveButton');
    const newFolderInput = document.getElementById('newFolderInput');
    const newFolderConfirm = document.getElementById('newFolderConfirm');
    const newFolderName = document.getElementById('newFolderName');
    const resetButton = document.getElementById('resetButton'); // Get the new reset button
  
    let bookmarks = [];
    let currentIndex = 0;
    let currentFolderId = null;
  
    function loadBookmarks(folderId) {
      chrome.bookmarks.getChildren(folderId, (results) => {
        bookmarks = results;
        chrome.storage.local.get({ [folderId]: 0 }, (items) => {
          currentIndex = items[folderId];
          if (currentIndex >= bookmarks.length) {
            currentIndex = 0;
          }
          displayBookmark();
        });
      });
    }
  
    function displayBookmark() {
      if (currentIndex < bookmarks.length) {
        bookmarkTitle.textContent = bookmarks[currentIndex].title;
        bookmarkUrl.textContent = bookmarks[currentIndex].url;
  
        let faviconUrl = '';
  
        try {
          const urlObj = new URL(bookmarks[currentIndex].url);
          faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${urlObj.hostname}`;
        } catch (error) {
          faviconUrl = '';
        }
  
        const img = document.createElement('img');
        img.src = faviconUrl;
        img.style.width = '16px';
        img.style.height = '16px';
  
        const faviconContainer = document.createElement('div');
        faviconContainer.appendChild(img);
        bookmarkTitle.prepend(faviconContainer);
  
        document.getElementById('bookmarkDisplay').style.cursor = 'pointer';
        document.getElementById('bookmarkDisplay').onclick = () => {
          chrome.tabs.create({ url: bookmarks[currentIndex].url, active: true });
        };
      } else {
        bookmarkTitle.textContent = 'Folder Complete!';
        bookmarkUrl.textContent = '';
        document.getElementById('bookmarkDisplay').style.cursor = 'default';
        document.getElementById('bookmarkDisplay').onclick = null;
      }
    }
  
    function deleteBookmark() {
      if (currentIndex < bookmarks.length) {
        chrome.bookmarks.remove(bookmarks[currentIndex].id, () => {
          bookmarks.splice(currentIndex, 1);
          chrome.storage.local.set({ [currentFolderId]: currentIndex }, () => {
            displayBookmark();
          });
        });
      }
    }
  
    function keepBookmark() {
      if (currentIndex < bookmarks.length) {
        currentIndex++;
        chrome.storage.local.set({ [currentFolderId]: currentIndex }, () => {
          displayBookmark();
        });
      }
    }
  
    function populateFolders() {
      chrome.bookmarks.getTree((bookmarkTreeNodes) => {
        const folders = [];
        function traverseBookmarks(nodes) {
          for (const node of nodes) {
            if (node.children && node.children.length > 0) {
              folders.push(node);
              traverseBookmarks(node.children);
            }
          }
        }
        traverseBookmarks(bookmarkTreeNodes);
  
        folders.forEach((folder) => {
          const option = document.createElement('option');
          option.value = folder.id;
          option.textContent = folder.title;
          folderSelect.appendChild(option);
        });
  
        if (folders.length > 0) {
          currentFolderId = folders[0].id;
          loadBookmarks(currentFolderId);
        }
      });
    }
  
    folderSelect.addEventListener('change', (event) => {
      currentFolderId = event.target.value;
      loadBookmarks(currentFolderId);
    });
  
    deleteButton.addEventListener('click', deleteBookmark);
    keepButton.addEventListener('click', keepBookmark);
  
    moveButton.addEventListener('click', () => {
      newFolderInput.style.display = 'block';
      newFolderConfirm.style.display = 'block';
    });
  
    newFolderConfirm.addEventListener('click', () => {
      const newFolderNameValue = newFolderName.value;
      if (currentIndex < bookmarks.length) {
        chrome.bookmarks.create({ parentId: currentFolderId, title: newFolderNameValue, url: null }, (folder) => {
          chrome.bookmarks.move(bookmarks[currentIndex].id, { parentId: folder.id }, () => {
            bookmarks.splice(currentIndex, 1);
            chrome.storage.local.set({ [currentFolderId]: currentIndex }, () => {
              displayBookmark();
              newFolderInput.style.display = 'none';
              newFolderConfirm.style.display = 'none';
              newFolderName.value = '';
            });
          });
        });
      }
    });
  
    // Reset functionality
    resetButton.addEventListener('click', () => {
      chrome.storage.local.clear(() => {
        // Optionally, reload the popup to reflect the reset state
        window.location.reload();
      });
    });
  
    populateFolders();
  });