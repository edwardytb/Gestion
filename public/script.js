// Variables globales
let metricsData = {};
let budgetData = {};
let objectives = {
    youtube: { current: 14, target: 1000 },
    instagram: { current: 12, target: 500 },
    tiktok: { current: 12, target: 300 }
};

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Función de inicialización
async function initializeApp() {
    try {
        console.log('🚀 Inicializando aplicación...');
        
        // Verificar dependencias
        if (typeof Chart === 'undefined') {
            console.warn('⚠️ Chart.js no está disponible');
        }
        
        if (typeof Swal === 'undefined') {
            console.warn('⚠️ SweetAlert2 no está disponible');
        }
        
        // Cargar datos localmente (SIN BACKEND)
        await loadDataFromServer();
        
        // Configurar navegación
        setupNavigation();
        
        // Configurar eventos
        setupEventListeners();
        
        // Actualizar la interfaz
        updateDashboard();
        updateBudgetSection();
        updateObjectivesSection();
        
        console.log('✅ Aplicación inicializada correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando la app:', error);
        showError('Error al cargar la aplicación: ' + error.message);
    }
}

// Configurar navegación entre secciones
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remover clase activa de todos los enlaces
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Agregar clase activa al enlace clickeado
            this.classList.add('active');
            
            // Ocultar todas las secciones
            const sections = document.querySelectorAll('.section');
            sections.forEach(section => section.classList.remove('active'));
            
            // Mostrar la sección correspondiente
            const targetId = this.getAttribute('href').substring(1);
            document.getElementById(targetId).classList.add('active');
        });
    });
}

// Configurar eventos
function setupEventListeners() {
    // Botones para agregar transacciones
    document.getElementById('add-income').addEventListener('click', function() {
        openTransactionModal('income');
    });
    
    document.getElementById('add-expense').addEventListener('click', function() {
        openTransactionModal('expense');
    });
    
    // Modal de transacciones
    const modal = document.getElementById('transaction-modal');
    const closeBtn = document.querySelector('.close');
    const cancelBtn = document.getElementById('cancel-transaction');
    
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    cancelBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Formulario de transacción
    document.getElementById('transaction-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveTransaction();
    });
}

// Cargar datos localmente - VERSIÓN NETLIFY (SIN BACKEND)
async function loadDataFromServer() {
    try {
        console.log('📥 Cargando datos localmente...');
        
        // Cargar desde localStorage o usar datos por defecto
        const savedMetrics = localStorage.getItem('appMetrics');
        const savedBudget = localStorage.getItem('appBudget');
        
        if (savedMetrics && savedBudget) {
            // Cargar datos guardados
            metricsData = JSON.parse(savedMetrics);
            budgetData = JSON.parse(savedBudget);
            console.log('✅ Datos cargados desde localStorage');
        } else {
            // Datos por defecto
            metricsData = {
                youtube: { subscribers: 14, views: 181 },
                tiktok: { likes: 42, followers: 12, following: 5 },
                instagram: { followers: 12, following: 8, posts: 0 }
            };
            
            budgetData = {
                transactions: [],
                totals: { income: 0, expenses: 0, balance: 0 }
            };
            
            // Guardar por primera vez
            localStorage.setItem('appMetrics', JSON.stringify(metricsData));
            localStorage.setItem('appBudget', JSON.stringify(budgetData));
            console.log('✅ Datos iniciales creados y guardados');
        }
        
        // Actualizar objetivos con datos reales
        if (metricsData.youtube) {
            objectives.youtube.current = metricsData.youtube.subscribers;
        }
        if (metricsData.instagram) {
            objectives.instagram.current = metricsData.instagram.followers;
        }
        if (metricsData.tiktok) {
            objectives.tiktok.current = metricsData.tiktok.followers;
        }
        
    } catch (error) {
        console.error('❌ Error cargando datos:', error);
        // Datos de emergencia
        metricsData = {
            youtube: { subscribers: 14, views: 181 },
            tiktok: { likes: 42, followers: 12 },
            instagram: { followers: 12 }
        };
        budgetData = { 
            transactions: [], 
            totals: { income: 0, expenses: 0, balance: 0 } 
        };
    }
}

// Guardar transacción - VERSIÓN NETLIFY (SIN BACKEND)
async function saveTransaction() {
    const type = document.getElementById('transaction-type').value;
    const amount = parseFloat(document.getElementById('transaction-amount').value);
    const description = document.getElementById('transaction-description').value;
    const category = document.getElementById('transaction-category').value;
    const date = document.getElementById('transaction-date').value;

    // Validación básica
    if (!amount || amount <= 0) {
        showError('El monto debe ser mayor a 0');
        return;
    }

    if (!description.trim()) {
        showError('La descripción es obligatoria');
        return;
    }

    try {
        const newTransaction = {
            id: budgetData.transactions.length > 0 
                ? Math.max(...budgetData.transactions.map(t => t.id)) + 1 
                : 1,
            type: type,
            amount: amount,
            description: description.trim(),
            category: category,
            date: date
        };

        console.log('💾 Guardando transacción localmente:', newTransaction);

        // Guardar localmente
        budgetData.transactions.push(newTransaction);
        
        // Persistir en localStorage
        localStorage.setItem('appBudget', JSON.stringify(budgetData));
        
        // Actualizar interfaz
        updateBudgetSection();
        
        // Cerrar modal
        document.getElementById('transaction-modal').style.display = 'none';
        
        // Mostrar éxito
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: '¡Éxito!',
                text: 'Transacción guardada correctamente',
                icon: 'success',
                confirmButtonText: 'Aceptar'
            });
        } else {
            alert('Transacción guardada correctamente');
        }

    } catch (error) {
        console.error('❌ Error guardando transacción:', error);
        showError('No se pudo guardar la transacción: ' + error.message);
    }
}

// Eliminar transacción - VERSIÓN NETLIFY (SIN BACKEND)
async function deleteTransaction(id) {
    if (typeof Swal === 'undefined') {
        if (!confirm('¿Estás seguro de eliminar esta transacción?')) return;
    } else {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });
        
        if (!result.isConfirmed) return;
    }
    
    try {
        // Eliminar localmente
        budgetData.transactions = budgetData.transactions.filter(t => t.id !== id);
        
        // Guardar en localStorage
        localStorage.setItem('appBudget', JSON.stringify(budgetData));
        
        // Actualizar interfaz
        updateBudgetSection();
        
        if (typeof Swal !== 'undefined') {
            Swal.fire('¡Eliminado!', 'La transacción ha sido eliminada', 'success');
        } else {
            alert('Transacción eliminada correctamente');
        }

    } catch (error) {
        console.error('❌ Error eliminando transacción:', error);
        showError('No se pudo eliminar la transacción');
    }
}

// Actualizar el dashboard
function updateDashboard() {
    if (!metricsData.youtube) return;
    
    // Actualizar métricas
    document.getElementById('yt-subs').textContent = metricsData.youtube.subscribers;
    document.getElementById('yt-views').textContent = metricsData.youtube.views;
    document.getElementById('tt-likes').textContent = metricsData.tiktok.likes;
    document.getElementById('tt-followers').textContent = metricsData.tiktok.followers;
    document.getElementById('ig-followers').textContent = metricsData.instagram.followers;
    document.getElementById('ig-posts').textContent = metricsData.instagram.posts || 0;
    
    // Actualizar gráfico
    updateMetricsChart();
}

// Actualizar gráfico de métricas
function updateMetricsChart() {
    const ctx = document.getElementById('metricsChart');
    if (!ctx) {
        console.log('❌ No se encontró el elemento metricsChart');
        return;
    }
    
    // Verificar que Chart esté disponible
    if (typeof Chart === 'undefined') {
        console.log('❌ Chart.js no está cargado');
        ctx.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #666;">
                <h3>📊 Métricas de Redes Sociales</h3>
                <p>YouTube: ${metricsData.youtube.subscribers} suscriptores, ${metricsData.youtube.views} vistas</p>
                <p>TikTok: ${metricsData.tiktok.followers} seguidores, ${metricsData.tiktok.likes} me gusta</p>
                <p>Instagram: ${metricsData.instagram.followers} seguidores</p>
            </div>
        `;
        return;
    }
    
    // Destruir gráfico existente si existe
    if (window.metricsChart && typeof window.metricsChart.destroy === 'function') {
        window.metricsChart.destroy();
    }
    
    try {
        window.metricsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['YouTube Suscriptores', 'YouTube Vistas', 'TikTok Me gusta', 'TikTok Seguidores', 'Instagram Seguidores'],
                datasets: [{
                    label: 'Métricas Actuales',
                    data: [
                        metricsData.youtube.subscribers,
                        metricsData.youtube.views,
                        metricsData.tiktok.likes,
                        metricsData.tiktok.followers,
                        metricsData.instagram.followers
                    ],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        console.log('✅ Gráfico creado correctamente');
    } catch (error) {
        console.error('❌ Error creando el gráfico:', error);
    }
}

// Actualizar sección de presupuesto
function updateBudgetSection() {
    if (!budgetData.transactions) return;
    
    // Calcular totales
    calculateTotals();
    
    // Actualizar resumen
    document.getElementById('total-income').textContent = `$${budgetData.totals.income.toFixed(2)}`;
    document.getElementById('total-expenses').textContent = `$${budgetData.totals.expenses.toFixed(2)}`;
    document.getElementById('balance').textContent = `$${budgetData.totals.balance.toFixed(2)}`;
    
    // Actualizar color del balance
    const balanceElement = document.getElementById('balance');
    balanceElement.className = 'amount';
    if (budgetData.totals.balance > 0) {
        balanceElement.classList.add('positive');
    } else if (budgetData.totals.balance < 0) {
        balanceElement.classList.add('negative');
    }
    
    // Actualizar tabla de transacciones
    updateTransactionsTable();
}

// Calcular totales de presupuesto
function calculateTotals() {
    let income = 0;
    let expenses = 0;
    
    budgetData.transactions.forEach(transaction => {
        if (transaction.type === 'income') {
            income += transaction.amount;
        } else {
            expenses += transaction.amount;
        }
    });
    
    budgetData.totals.income = income;
    budgetData.totals.expenses = expenses;
    budgetData.totals.balance = income - expenses;
}

// Actualizar tabla de transacciones
function updateTransactionsTable() {
    const tbody = document.getElementById('transactions-body');
    tbody.innerHTML = '';
    
    if (!budgetData.transactions || budgetData.transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay transacciones registradas</td></tr>';
        return;
    }
    
    // Ordenar transacciones por fecha (más recientes primero)
    const sortedTransactions = [...budgetData.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        
        // Formatear fecha
        const date = new Date(transaction.date);
        const formattedDate = date.toLocaleDateString('es-ES');
        
        // Determinar clase para el monto
        const amountClass = transaction.type === 'income' ? 'positive' : 'negative';
        const amountPrefix = transaction.type === 'income' ? '+' : '-';
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${transaction.description}</td>
            <td>${transaction.category}</td>
            <td class="${amountClass}">${amountPrefix}$${transaction.amount.toFixed(2)}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="deleteTransaction(${transaction.id})">Eliminar</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Abrir modal para agregar transacción
function openTransactionModal(type) {
    const modal = document.getElementById('transaction-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('transaction-form');
    
    // Resetear formulario
    form.reset();
    document.getElementById('transaction-id').value = '';
    
    // Configurar modal según el tipo
    if (type === 'income') {
        modalTitle.textContent = 'Agregar Ingreso';
        document.getElementById('transaction-type').value = 'income';
    } else {
        modalTitle.textContent = 'Agregar Gasto';
        document.getElementById('transaction-type').value = 'expense';
    }
    
    // Establecer fecha actual por defecto
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('transaction-date').value = today;
    
    // Mostrar modal
    modal.style.display = 'block';
}

// Actualizar sección de objetivos
function updateObjectivesSection() {
    // Actualizar valores actuales y objetivos
    document.getElementById('yt-current').textContent = objectives.youtube.current;
    document.getElementById('yt-target').textContent = objectives.youtube.target;
    document.getElementById('ig-current').textContent = objectives.instagram.current;
    document.getElementById('ig-target').textContent = objectives.instagram.target;
    document.getElementById('tt-current').textContent = objectives.tiktok.current;
    document.getElementById('tt-target').textContent = objectives.tiktok.target;
    
    // Actualizar barras de progreso
    updateProgressBars();
    
    // Actualizar recomendaciones
    updateRecommendations();
    
    // Actualizar análisis de recursos
    updateResourcesAnalysis();
}

// Actualizar barras de progreso
function updateProgressBars() {
    // YouTube
    const ytProgress = (objectives.youtube.current / objectives.youtube.target) * 100;
    document.getElementById('yt-progress').style.width = `${Math.min(ytProgress, 100)}%`;
    document.getElementById('yt-percentage').textContent = `${ytProgress.toFixed(1)}%`;
    
    // Instagram
    const igProgress = (objectives.instagram.current / objectives.instagram.target) * 100;
    document.getElementById('ig-progress').style.width = `${Math.min(igProgress, 100)}%`;
    document.getElementById('ig-percentage').textContent = `${igProgress.toFixed(1)}%`;
    
    // TikTok
    const ttProgress = (objectives.tiktok.current / objectives.tiktok.target) * 100;
    document.getElementById('tt-progress').style.width = `${Math.min(ttProgress, 100)}%`;
    document.getElementById('tt-percentage').textContent = `${ttProgress.toFixed(1)}%`;
}

// Actualizar recomendaciones
function updateRecommendations() {
    // Recomendaciones para YouTube
    const ytRecommendations = document.getElementById('yt-recommendations');
    ytRecommendations.innerHTML = '';
    
    const ytRecs = [
        'Publica contenido de forma consistente (al menos 2-3 veces por semana)',
        'Optimiza títulos y descripciones con palabras clave relevantes',
        'Crea miniaturas atractivas y consistentes',
        'Interactúa con tu audiencia en los comentarios',
        'Colabora con otros creadores de tu nicho'
    ];
    
    ytRecs.forEach(rec => {
        const li = document.createElement('li');
        li.textContent = rec;
        ytRecommendations.appendChild(li);
    });
    
    // Recomendaciones para Instagram
    const igRecommendations = document.getElementById('ig-recommendations');
    igRecommendations.innerHTML = '';
    
    const igRecs = [
        'Publica contenido visualmente atractivo y de alta calidad',
        'Usa hashtags relevantes y estratégicos',
        'Interactúa con cuentas similares y tu audiencia',
        'Utiliza las Historias para mantener el engagement',
        'Considera publicar Reels para mayor alcance'
    ];
    
    igRecs.forEach(rec => {
        const li = document.createElement('li');
        li.textContent = rec;
        igRecommendations.appendChild(li);
    });
    
    // Recomendaciones para TikTok
    const ttRecommendations = document.getElementById('tt-recommendations');
    ttRecommendations.innerHTML = '';
    
    const ttRecs = [
        'Crea videos cortos, entretenidos y de ritmo rápido',
        'Participa en tendencias y desafíos virales',
        'Usa música popular y efectos creativos',
        'Publica con frecuencia (idealmente diario)',
        'Interactúa con otros creadores mediante duetos'
    ];
    
    ttRecs.forEach(rec => {
        const li = document.createElement('li');
        li.textContent = rec;
        ttRecommendations.appendChild(li);
    });
}

// Actualizar análisis de recursos
function updateResourcesAnalysis() {
    const analysisElement = document.getElementById('resources-analysis');
    
    // Calcular necesidades basadas en objetivos
    const ytGrowthNeeded = objectives.youtube.target - objectives.youtube.current;
    const igGrowthNeeded = objectives.instagram.target - objectives.instagram.current;
    const ttGrowthNeeded = objectives.tiktok.target - objectives.tiktok.current;
    
    // Estimación de recursos necesarios
    const estimatedBudget = (ytGrowthNeeded * 0.5) + (igGrowthNeeded * 0.3) + (ttGrowthNeeded * 0.2);
    const timeInvestment = Math.ceil((ytGrowthNeeded / 10) + (igGrowthNeeded / 5) + (ttGrowthNeeded / 8));
    
    analysisElement.innerHTML = `
        <p>Para alcanzar tus objetivos, necesitarás aproximadamente:</p>
        <ul>
            <li><strong>Presupuesto estimado:</strong> $${estimatedBudget.toFixed(2)} (para publicidad, herramientas, etc.)</li>
            <li><strong>Inversión de tiempo:</strong> ${timeInvestment} horas semanales</li>
            <li><strong>Contenido necesario:</strong> 
                <ul>
                    <li>YouTube: ${Math.ceil(ytGrowthNeeded / 50)} videos adicionales</li>
                    <li>Instagram: ${Math.ceil(igGrowthNeeded / 10)} publicaciones adicionales</li>
                    <li>TikTok: ${Math.ceil(ttGrowthNeeded / 5)} videos adicionales</li>
                </ul>
            </li>
        </ul>
        <p><strong>Recomendación:</strong> Enfócate en una plataforma a la vez para maximizar resultados.</p>
    `;
}

// Función auxiliar para mostrar errores
function showError(message) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Error',
            text: message,
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    } else {
        alert('Error: ' + message);
    }
}

// Hacer funciones globales para que puedan ser llamadas desde HTML
window.deleteTransaction = deleteTransaction;