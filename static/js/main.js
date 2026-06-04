$(document).ready(function() {
    let formCounter = 1;
    let totalInputs = 1; // Общее количество полей на текущий момент

    // Перехватываем клик по кнопке отправки
    $(document).on('click', '.submit-btn', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const $button = $(this);
        const $form = $button.closest('form');
        const $card = $button.closest('.form-card');

        // Простая валидация перед отправкой
        let allValid = true;
        $form.find('input[required]').each(function() {
            if ($(this).val().trim() === '') {
                allValid = false;
                $(this).css('border-color', '#ff4d4d');
            } else {
                $(this).css('border-color', '#ccc');
            }
        });

        if (!allValid) {
            alert('Пожалуйста, заполните все поля перед отправкой.');
            return false;
        }

        // Отправляем данные на бэкенд Flask через AJAX
        $.ajax({
            url: '/submit',
            method: 'POST',
            data: $form.serialize(),
            dataType: 'json',
            success: function(response) {
                if (response.status === 'success') {
                    // 1. Старую форму замораживаем: поля только для чтения, кнопка отключена
                    $form.find('input').attr('readonly', true).addClass('frozen-input');
                    $button.attr('disabled', true).text('Сохранено в PostgreSQL');
                    $card.removeClass('active-form').addClass('submitted-form');
                    $card.find('h3').append(' ✓');

                    // 2. Увеличиваем общее количество полей на 1
                    totalInputs++;

                    // 3. Генерируем и вставляем новую форму НИЖЕ (с новым полем)
                    formCounter++;
                    generateNextForm(totalInputs);
                }
            },
            error: function(xhr) {
                console.error("Ошибка AJAX:", xhr.responseText);
                alert('Не удалось отправить запрос на сервер. Проверьте консоль Flask.');
            }
        });
    });

    // Функция динамического добавления новой формы в DOM-дерево
    function generateNextForm(totalInputs) {
        let inputsHtml = '';

        // Добавляем только одно новое поле (последнее)
        const inputName = `input_name${totalInputs - 1}`;
        inputsHtml += `
            <div class="input-group">
                <label>${inputName}:</label>
                <input type="text" name="${inputName}" placeholder="Введите значение" required>
            </div>
        `;

        const newFormCardHtml = `
            <div class="form-card active-form">
                <h3>Форма №${formCounter}</h3>
                <form class="ajax-form" onsubmit="return false;">
                    <div class="inputs-wrapper">
                        ${inputsHtml}
                    </div>
                    <div class="actions">
                        <button type="button" class="submit-btn">Отправить и расширить</button>
                    </div>
                </form>
            </div>
        `;

        // Добавляем новую форму в конец контейнера
        $('#forms-container').append(newFormCardHtml);
    }

    // Кнопка просмотра логов JSON из PostgreSQL
    $('#toggle-viewer-btn').click(function(e) {
        e.preventDefault();
        const $viewer = $('#json-viewer');

        if ($viewer.is(':visible')) {
            $viewer.slideUp();
        } else {
            $.ajax({
                url: '/records',
                method: 'GET',
                dataType: 'json',
                success: function(data) {
                    $('#records-list').empty();

                    if (!data || data.length === 0) {
                        $('#records-list').append('<p>В базе данных пока нет сохраненных JSONB записей.</p>');
                    } else {
                        data.forEach(function(record) {
                            const prettyJson = JSON.stringify(record.data, null, 2);
                            const recordHtml = `
                                <div class="record-card">
                                    <h4>Запись №${record.id}</h4>
                                    <pre>${prettyJson}</pre>
                                </div>
                            `;
                            $('#records-list').append(recordHtml);
                        });
                    }
                    $viewer.slideDown();
                },
                error: function(xhr) {
                    console.error("Ошибка при получении JSON:", xhr.responseText);
                    alert('Не удалось загрузить данные из эндпоинта /records.');
                }
            });
        }
    });
});