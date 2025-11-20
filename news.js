// ambil data dari JSON
fetch('news.json')
  .then(response => response.json())
  .then(data => {
    // bagian news
    let newsContainer = document.getElementById('news-list');
    data.news.forEach(item => {
      newsContainer.innerHTML += `
        <div class="news-item">
          <a href="${item.link}" class="news-content">
            <img src="${item.image}" alt="${item.title}">
            <div class="news-text">
              <h3>${item.title}</h3>
              <p>${item.desc}</p>
            </div>
          </a>
        </div>
      `;
    });

    // bagian announcements
    let announcementContainer = document.getElementById('announcement-list');
    data.announcements.forEach(item => {
      announcementContainer.innerHTML += `
        <div class="announcement-item">
          <a href="${item.link}" class="news-content">
            <img src="${item.image}" alt="${item.title}">
            <div class="news-text">
              <h3>${item.title}</h3>
              <p>${item.desc}</p>
            </div>
          </a>
        </div>
      `;
    });
  })
  .catch(error => console.error("Gagal ambil JSON:", error));