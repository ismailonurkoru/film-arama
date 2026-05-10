$(function(){
  const $input  = $('#searchInput');
  const $btn    = $('#searchBtn');
  const $grid   = $('#resultsGrid');
  const $status = $('#statusArea');
  const $title  = $('#sectionTitle');
  const $paginationWrapper = $('#paginationWrapper');
  
  // Filtre Elementleri
  const $genreSelect = $('#genreSelect');
  const $navLinks    = $('.nav-link');
  const $logo        = $('#logoBrand');

  // Kendi TMDb API Anahtarını buraya yapıştır
  const apiKey = 'fb496c19788d90b1a1887410a059e897';

  // Durum Yönetimi
  let currentPage = 1;
  let totalPages = 1;
  let currentMode = 'discover'; 
  let currentQuery = '';
  let currentSort = 'popularity.desc';

  // Kartları Çizme
  function renderMovies(movies, emptyMessage) {
    $grid.empty();
    
    if(!movies || !movies.length){
      $status.html(`<div class="status-msg">😕 ${emptyMessage}</div>`);
      $paginationWrapper.addClass('d-none');
      return;
    }
    
    $status.empty();
    
    $.each(movies, function(i, movie){
      const img = movie.poster_path ? 'https://image.tmdb.org/t/p/w500' + movie.poster_path : null;
      const rating = movie.vote_average > 0 ? movie.vote_average.toFixed(1) : null;
      const releaseDate = movie.release_date ? movie.release_date.split('-')[0] : 'Bilinmiyor';
      const tmdbUrl = 'https://www.themoviedb.org/movie/' + movie.id;

      const imgHtml = img
        ? `<img src="${img}" alt="${$('<span>').text(movie.title).html()}" loading="lazy">`
        : '<div class="no-img-placeholder">Resim Yok</div>';

      const ratingHtml = rating ? `<span class="rating-badge">★ ${rating}</span>` : '';
      const metaHtml = `<span class="meta-tag">${releaseDate}</span>`;

      const card = `
        <div class="col-12 col-sm-6 col-lg-3 fade-up" style="animation-delay:${i*40}ms">
          <div class="show-card">
            <div class="card-img-wrap">${imgHtml}${ratingHtml}</div>
            <div class="card-body-custom">
              <h5>${$('<span>').text(movie.title).html()}</h5>
              <div class="meta-row">${metaHtml}</div>
              <a href="${tmdbUrl}" target="_blank" rel="noopener" class="btn-details">Detayları Gör</a>
            </div>
          </div>
        </div>`;
      $grid.append(card);
    });
  }

  // Sayfalama UI
  function updatePaginationUI() {
    if (totalPages > 1) {
      $paginationWrapper.removeClass('d-none');
      $('#pageInfo').text(`Sayfa ${currentPage} / ${totalPages}`);
      $('#prevPage').prop('disabled', currentPage === 1);
      $('#nextPage').prop('disabled', currentPage === totalPages);
    } else {
      $paginationWrapper.addClass('d-none');
    }
  }

  function scrollToResults() {
    $('html, body').animate({ scrollTop: $('#resultsSection').offset().top - 80 }, 400);
  }

  // API Çekme
  function fetchMovies(url, titleText, emptyMessage) {
    $grid.empty();
    $title.text(titleText);
    $status.html('<div class="status-msg"><div class="spinner-border mb-3" role="status"></div><br>Filmler yükleniyor…</div>');
    $paginationWrapper.addClass('d-none'); 

    $.getJSON(url)
      .done(function(data){
        currentPage = data.page;
        totalPages = Math.min(data.total_pages, 500); 
        renderMovies(data.results, emptyMessage);
        updatePaginationUI();
      })
      .fail(function(){
        $status.html('<div class="status-msg">⚠️ Bir hata oluştu. API anahtarınızı kontrol edin.</div>');
      });
  }

  // Ana Yükleme Fonksiyonu
  function loadData(page) {
    let url = '';
    let titleText = '';
    let emptyMsg = '';

    if (currentMode === 'search') {
      url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(currentQuery)}&language=tr-TR&page=${page}`;
      titleText = `"${currentQuery}" İçin Arama Sonuçları`;
      emptyMsg = 'Film bulunamadı. Farklı bir isim deneyin!';
    } 
    else if (currentMode === 'discover') {
      const genre = $genreSelect.val();

      url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=tr-TR&page=${page}&vote_count.gte=50&sort_by=${currentSort}`;
      
      if(genre) url += `&with_genres=${genre}`;

      titleText = "Popüler Filmler";
      if (genre) {
        titleText = $("#genreSelect option:selected").text() + " Filmleri";
      } else if (currentSort === 'primary_release_date.desc') {
        titleText = "Yeni Çıkan Filmler";
      } else if (currentSort === 'vote_average.desc') {
        titleText = "En Yüksek Puanlılar";
      }

      emptyMsg = 'Kriterlerinize uygun film bulunamadı.';
    }

    fetchMovies(url, titleText, emptyMsg);
  }

  // Arama İşlemi
  function triggerSearch() {
    const q = $.trim($input.val());
    if(!q) return;

    currentMode = 'search';
    currentQuery = q;
    
    $genreSelect.val('');
    $navLinks.removeClass('active');
    
    loadData(1);
  }

  // Tür Filtresi Değiştiğinde
  function triggerFilter() {
    currentMode = 'discover';
    $input.val(''); 
    loadData(1);
  }

  // Navigasyon Menüsü Tıklamaları
  $navLinks.on('click', function(e) {
    e.preventDefault();
    $navLinks.removeClass('active');
    $(this).addClass('active');

    const action = $(this).data('action');
    currentMode = 'discover';
    $input.val('');
    $genreSelect.val(''); 

    if (action === 'home' || action === 'popular') {
      currentSort = 'popularity.desc';
    } else if (action === 'new') {
      currentSort = 'primary_release_date.desc';
    } else if (action === 'lists') {
      currentSort = 'vote_average.desc';
    }

    loadData(1);
  });

  // Logoya Tıklayınca Ana Sayfaya Dön
  $logo.on('click', function() {
    $navLinks.filter('[data-action="home"]').click();
  });
  
  $btn.on('click', triggerSearch);
  $input.on('keydown', function(e){ if(e.key === 'Enter') triggerSearch(); });
  $genreSelect.on('change', triggerFilter);

  $('#prevPage').on('click', function() { if (currentPage > 1) { loadData(currentPage - 1); scrollToResults(); } });
  $('#nextPage').on('click', function() { if (currentPage < totalPages) { loadData(currentPage + 1); scrollToResults(); } });

  // Başlangıç Yüklemesi
  triggerFilter();
});