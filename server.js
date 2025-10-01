const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware básico
app.use(express.json());
app.use(express.static('public'));

// Crear directorio data si no existe
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
    console.log('📁 Directorio data creado');
}

// Datos por defecto
const defaultMetrics = {
    youtube: { subscribers: 14, views: 181 },
    tiktok: { likes: 42, followers: 12, following: 5 },
    instagram: { followers: 12, following: 8, posts: 0 }
};

const defaultBudget = {
    transactions: [],
    totals: { income: 0, expenses: 0, balance: 0 }
};

// RUTAS DE LA API

// Ruta de prueba
app.get('/test', (req, res) => {
    res.json({ message: '✅ El servidor funciona!', timestamp: new Date() });
});

// Obtener métricas
app.get('/api/metrics', (req, res) => {
    console.log('📊 Sirviendo /api/metrics');
    
    const metricsPath = path.join(dataDir, 'metrics.json');
    let metricsData = defaultMetrics;
    
    try {
        if (fs.existsSync(metricsPath)) {
            metricsData = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
            console.log('✅ Métricas cargadas del archivo');
        } else {
            fs.writeFileSync(metricsPath, JSON.stringify(defaultMetrics, null, 2));
            console.log('✅ Archivo metrics.json creado');
        }
    } catch (error) {
        console.log('⚠️ Usando métricas por defecto');
    }
    
    res.json(metricsData);
});

// Obtener presupuesto
app.get('/api/budget', (req, res) => {
    console.log('💰 Sirviendo /api/budget');
    
    const budgetPath = path.join(dataDir, 'budget.json');
    let budgetData = defaultBudget;
    
    try {
        if (fs.existsSync(budgetPath)) {
            budgetData = JSON.parse(fs.readFileSync(budgetPath, 'utf8'));
            console.log('✅ Presupuesto cargado del archivo');
        } else {
            fs.writeFileSync(budgetPath, JSON.stringify(defaultBudget, null, 2));
            console.log('✅ Archivo budget.json creado');
        }
    } catch (error) {
        console.log('⚠️ Usando presupuesto por defecto');
    }
    
    res.json(budgetData);
});

// Guardar métricas
app.put('/api/metrics', (req, res) => {
    console.log('💾 Guardando métricas...');
    
    try {
        const metricsPath = path.join(dataDir, 'metrics.json');
        fs.writeFileSync(metricsPath, JSON.stringify(req.body, null, 2));
        res.json({ message: 'Métricas guardadas correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error guardando métricas' });
    }
});

// Guardar presupuesto
app.put('/api/budget', (req, res) => {
    console.log('💾 Guardando presupuesto...');
    
    try {
        const budgetPath = path.join(dataDir, 'budget.json');
        fs.writeFileSync(budgetPath, JSON.stringify(req.body, null, 2));
        res.json({ message: 'Presupuesto guardado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error guardando presupuesto' });
    }
});

// Agregar transacción
app.post('/api/transactions', (req, res) => {
    console.log('➕ Agregando transacción:', req.body);
    
    try {
        const budgetPath = path.join(dataDir, 'budget.json');
        
        // Cargar presupuesto actual
        let budgetData = defaultBudget;
        if (fs.existsSync(budgetPath)) {
            budgetData = JSON.parse(fs.readFileSync(budgetPath, 'utf8'));
        }
        
        // Crear nueva transacción
        const newTransaction = {
            id: budgetData.transactions.length > 0 
                ? Math.max(...budgetData.transactions.map(t => t.id)) + 1 
                : 1,
            type: req.body.type,
            amount: parseFloat(req.body.amount),
            description: req.body.description,
            category: req.body.category,
            date: req.body.date || new Date().toISOString().split('T')[0]
        };
        
        // Agregar y guardar
        budgetData.transactions.push(newTransaction);
        fs.writeFileSync(budgetPath, JSON.stringify(budgetData, null, 2));
        
        res.json({ 
            message: 'Transacción agregada correctamente',
            transaction: newTransaction
        });
        
    } catch (error) {
        res.status(500).json({ error: 'Error agregando transacción' });
    }
});

// Eliminar transacción
app.delete('/api/transactions/:id', (req, res) => {
    const id = parseInt(req.params.id);
    console.log('🗑️ Eliminando transacción:', id);
    
    try {
        const budgetPath = path.join(dataDir, 'budget.json');
        
        if (!fs.existsSync(budgetPath)) {
            return res.status(404).json({ error: 'No hay transacciones' });
        }
        
        // Cargar y filtrar
        let budgetData = JSON.parse(fs.readFileSync(budgetPath, 'utf8'));
        budgetData.transactions = budgetData.transactions.filter(t => t.id !== id);
        
        // Guardar
        fs.writeFileSync(budgetPath, JSON.stringify(budgetData, null, 2));
        
        res.json({ message: 'Transacción eliminada correctamente' });
        
    } catch (error) {
        res.status(500).json({ error: 'Error eliminando transacción' });
    }
});

// Ruta de diagnóstico
app.get('/api/debug', (req, res) => {
    const debugInfo = {
        dataDir: dataDir,
        metricsExists: fs.existsSync(path.join(dataDir, 'metrics.json')),
        budgetExists: fs.existsSync(path.join(dataDir, 'budget.json')),
        directoryContents: fs.existsSync(dataDir) ? fs.readdirSync(dataDir) : []
    };
    
    res.json(debugInfo);
});

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log('🚀 Servidor ejecutándose en http://localhost:' + PORT);
    console.log('📊 Gestor Financiero - Estudio de Contenidos');
    console.log('⏰ Iniciado:', new Date().toLocaleString());
});