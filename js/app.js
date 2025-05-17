const API_BASE = 'http://localhost:8000/houses';

let allHouses = [];
let currentTab = 'all';

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

function loadHouses() {
    fetch(API_BASE)
        .then(res => res.json())
        .then(data => {
            allHouses = data;
            renderHouses();
        });
}

function renderHouses() {
    const filtered = currentTab === 'seen' ? allHouses.filter(h => h.viewed) : (currentTab === 'unseen' ? allHouses.filter(h => !h.viewed) : allHouses);
    $('#houseList').empty();
    $('#noData').toggle(filtered.length === 0);

    filtered.forEach(item => {
        const area = item.length * item.width;
        const pricePerM2 = item.price && area ? formatPrice(item.price / area) : '';
        const priceText = item.price ? `${formatPrice(item.price)} (${pricePerM2}/m²)` : 'Chưa rõ';

        const card = $(`
        <div class="col-12 house-card card p-3">
          <div class="d-flex justify-content-between">
            <h5 class="text-primary" style="cursor:pointer">${item.address}</h5>
            <span class="seen-icon" onclick="toggleSeen('${item._id}')">
              ${item.viewed ? '✅' : '❌'}
            </span>
          </div>
          <p>${item.info || ''}</p>
          <p>Diện tích: ${item.length || ''} x ${item.width || ''} m²</p>
          <p>Giá: ${priceText}</p>
          <p>Ngày đi xem: ${item.visitDate || ''}</p>
          <div class="d-flex justify-content-end gap-2 mt-2">
            <button class="btn btn-sm btn-warning max-w-max" onclick="editHouse('${item._id}')">Sửa</button>
            <button class="btn btn-sm btn-danger" onclick="deleteHouse('${item._id}')">Xóa</button>
        </div>
        </div>
      `);

        card.find('h5').click(() => {
            const url = `https://www.google.com/maps/embed/v1/place?key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg&q=${encodeURIComponent(h.address)}`;
            $('#mapIframe').attr('src', url);
            new bootstrap.Modal(document.getElementById('mapModal')).show();
        });

        $('#houseList').append(card);
    });
}

function toggleSeen(id) {
    const house = allHouses.find(h => h._id === id);
    const updated = { viewed: !house.viewed };
    fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
    }).then(() => loadHouses());
}

function closeModal() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('houseModal'));
    if (modal) {
        modal.hide();
    }
}

$('#btnAdd').click(() => {
    $('#houseForm')[0].reset();
    $('#houseId').val('');
    $('#isViewedContainer').hide();
    new bootstrap.Modal(document.getElementById('houseModal')).show();
});

$('#houseForm').submit(function (e) {
    e.preventDefault();
    const id = $('#houseId').val();
    const data = {};
    ['address', 'info', 'price', 'length', 'width', 'visitDate'].forEach(f => {
        const val = $(`#${f}`).val();
        if (val) data[f] = f === 'price' || f === 'length' || f === 'width' ? +val : val;
    });
    if ($('#viewed').is(':visible')) data.viewed = $('#viewed').is(':checked');

    const method = id ? 'PATCH' : 'POST';
    const url = id ? `${API_BASE}/${id}` : API_BASE;

    fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(() => {
        loadHouses();
        closeModal();
    });
});

// Edit
function editHouse(id) {
    const house = allHouses.find(h => h._id === id);
    Object.entries(house).forEach(([key, val]) => $(`#${key}`).val(val));
    $('#isViewedContainer').show();
    new bootstrap.Modal(document.getElementById('houseModal')).show();
}

// Delete
function deleteHouse(id) {
    if (!confirm('Bạn có chắc muốn xóa?')) return;

    fetch(`${API_BASE}/estates/${id}`, {
        method: 'DELETE'
    })
        .then(res => {
            if (res.ok) {
                loadHouses();
            }
        })
        .catch(err => console.error(err));
}


$('#tabView .nav-link').click(function (e) {
    e.preventDefault();
    $('#tabView .nav-link').removeClass('active');
    $(this).addClass('active');
    currentTab = $(this).data('tab');
    renderHouses();
});

$(document).ready(loadHouses);