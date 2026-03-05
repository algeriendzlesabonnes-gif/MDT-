const { useState, useEffect, useMemo } = React;

// --- CONFIGURATION DES GRADES ---
const GRADES = [
    { level: 1, name: "Police Officer I", access: ['patrol'] },
    { level: 2, name: "Police Officer II", access: ['patrol'] },
    { level: 3, name: "Police Officer III", access: ['patrol'] },
    { level: 4, name: "Police Detective I", access: ['investigation'] },
    { level: 5, name: "Police Detective II", access: ['investigation'] },
    { level: 6, name: "Police Detective III", access: ['investigation'] },
    { level: 7, name: "Sergeant I", access: ['patrol', 'supervision'] },
    { level: 8, name: "Sergeant II", access: ['patrol', 'supervision'] },
    { level: 9, name: "Lieutenant I", access: ['patrol', 'supervision'] },
    { level: 10, name: "Captain", access: ['etat-major'] },
    { level: 11, name: "Commander", access: ['etat-major', 'delete'] },
    { level: 12, name: "Deputy Chief", access: ['etat-major', 'delete'] },
    { level: 13, name: "Assistant Chief", access: ['etat-major', 'delete'] },
    { level: 14, name: "Chief of Police", access: ['admin', 'delete'] },
];

const App = () => {
    // --- ÉTAT GLOBAL ---
    const [view, setView] = useState('login');
    const [user, setUser] = useState(null);
    const [onDuty, setOnDuty] = useState(false);
    const [db, setDb] = useState({
        officers: [],
        citizens: [],
        records: [],
        reports: [],
        evidences: [],
        investigations: []
    });

    // --- CHARGEMENT INITIAL ---
    useEffect(() => {
        const savedData = localStorage.getItem('mdt_storage');
        if (savedData) {
            setDb(JSON.parse(savedData));
        } else {
            // Premier compte Admin
            const initialAdmin = {
                id: Date.now(),
                matricule: "0001",
                password: "admin",
                fullname: "Chief Administrator",
                grade: "Chief of Police",
                specialty: "État-Major",
                isAdmin: true
            };
            const newDb = { ...db, officers: [initialAdmin] };
            setDb(newDb);
            localStorage.setItem('mdt_storage', JSON.stringify(newDb));
        }
        lucide.createIcons();
    }, []);

    // Sauvegarde automatique à chaque changement
    useEffect(() => {
        if (db.officers.length > 0) {
            localStorage.setItem('mdt_storage', JSON.stringify(db));
        }
    }, [db]);

    // --- LOGIQUE AUTH ---
    const handleLogin = (e) => {
        e.preventDefault();
        const mat = e.target.matricule.value;
        const pass = e.target.password.value;
        const found = db.officers.find(o => o.matricule === mat && o.password === pass);
        
        if (found) {
            setUser(found);
            setView('dashboard');
        } else {
            alert("Identifiants incorrects");
        }
    };

    const handleLogout = () => {
        setOnDuty(false);
        setUser(null);
        setView('login');
    };

    // --- PERMISSIONS ---
    const canDelete = useMemo(() => {
        if (!user) return false;
        const gradeInfo = GRADES.find(g => g.name === user.grade);
        return gradeInfo?.access.includes('delete') || user.isAdmin;
    }, [user]);

    const isDetective = useMemo(() => {
        if (!user) return false;
        return user.specialty === 'Detective' || user.grade.includes('Detective') || user.isAdmin;
    }, [user]);

    // --- RENDERER DE VUES ---
    const renderContent = () => {
        switch(view) {
            case 'dashboard': return <Dashboard db={db} setOnDuty={setOnDuty} onDuty={onDuty} user={user} />;
            case 'citoyens': return <Citizens db={db} setDb={setDb} />;
            case 'casier': return <CriminalRecords db={db} setDb={setDb} user={user} />;
            case 'rapports': return <ServiceReports db={db} setDb={setDb} user={user} canDelete={canDelete} />;
            case 'admin': return <AdminPanel db={db} setDb={setDb} user={user} />;
            case 'enquetes': return isDetective ? <Investigations db={db} setDb={setDb} user={user} /> : <AccessDenied />;
            default: return <Dashboard db={db} />;
        }
    };

    if (view === 'login') return <LoginView onLogin={handleLogin} />;

    return (
        <div className="flex h-screen w-full bg-[#020617] text-slate-200">
            {/* SIDEBAR */}
            <aside className="w-72 glass border-r border-white/5 flex flex-col p-6 z-20">
                <div class="flex items-center gap-3 mb-10">
                    <img src="https://i.imgur.com/eW47qCV.png" className="w-10 h-10 object-contain" />
                    <div>
                        <h1 className="orbitron font-black text-lg leading-tight tracking-tighter">LAPD MDT</h1>
                        <p className="text-[9px] text-blue-500 font-bold uppercase tracking-[0.2em]">Daytona Division</p>
                    </div>
                </div>

                <nav className="flex-1 space-y-2">
                    <NavItem icon="layout-dashboard" label="Dashboard" active={view==='dashboard'} onClick={()=>setView('dashboard')} />
                    <NavItem icon="users" label="Citoyens" active={view==='citoyens'} onClick={()=>setView('citoyens')} />
                    <NavItem icon="scale" label="Casiers" active={view==='casier'} onClick={()=>setView('casier')} />
                    <NavItem icon="file-text" label="Rapports" active={view==='rapports'} onClick={()=>setView('rapports')} />
                    {isDetective && <NavItem icon="search" label="Enquêtes" active={view==='enquetes'} onClick={()=>setView('enquetes')} />}
                    {user.isAdmin && <NavItem icon="shield-check" label="Administration" active={view==='admin'} onClick={()=>setView('admin')} />}
                </nav>

                <div className="mt-auto border-t border-white/5 pt-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`w-3 h-3 rounded-full ${onDuty ? 'bg-green-500 active-pulse' : 'bg-red-500'}`}></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest">{onDuty ? 'En Service' : 'Hors Service'}</span>
                    </div>
                    <button 
                        onClick={() => setOnDuty(!onDuty)}
                        className={`w-full py-3 rounded-lg font-bold orbitron text-[10px] transition-all mb-4 ${onDuty ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'}`}
                    >
                        {onDuty ? 'FIN DE SERVICE' : 'PRISE DE SERVICE'}
                    </button>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="w-10 h-10 rounded-lg bg-blue-900/30 flex items-center justify-center font-bold text-blue-400">#{user.matricule.slice(-2)}</div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate uppercase">{user.fullname}</p>
                            <p className="text-[9px] text-slate-500 truncate">{user.grade}</p>
                        </div>
                        <button onClick={handleLogout} className="text-slate-500 hover:text-white"><i data-lucide="log-out" class="w-4 h-4"></i></button>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 overflow-y-auto p-10 relative">
                <header className="flex justify-between items-end mb-10">
                    <div>
                        <h2 className="orbitron text-4xl font-black italic tracking-tighter uppercase">{view}</h2>
                        <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest font-bold">Terminal Mobile de Données v3.2 — LAPD</p>
                    </div>
                    <div className="text-right">
                        <Clock />
                        <p className="text-[10px] text-slate-600 font-mono mt-1 uppercase tracking-widest">Daytona Security Encrypted</p>
                    </div>
                </header>
                <div className="fade-in">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

// --- SOUS-COMPOSANTS ---

const NavItem = ({ icon, label, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all font-bold text-xs uppercase tracking-widest ${active ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-600/5' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}
    >
        <i data-lucide={icon} className="w-5 h-5"></i>
        {label}
    </button>
);

const Clock = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    return <p className="orbitron text-2xl font-bold tracking-[0.2em]">{time.toLocaleTimeString()}</p>;
};

const Dashboard = ({ db, onDuty, user }) => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="Citoyens" val={db.citizens.length} color="blue" />
                <StatCard label="Casiers" val={db.records.length} color="red" />
                <StatCard label="Rapports" val={db.reports.length} color="green" />
                <StatCard label="Unités" val={onDuty ? 1 : 0} color="cyan" />
            </div>
            
            <div class="glass p-6 rounded-3xl">
                <h3 className="orbitron text-xs font-bold text-blue-400 uppercase tracking-widest mb-6">Derniers Rapports de Service</h3>
                <div className="space-y-3">
                    {db.reports.slice(-5).reverse().map(r => (
                        <div key={r.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-center">
                            <div>
                                <p className="text-sm font-bold uppercase">{r.unit} — {r.badge}</p>
                                <p className="text-[10px] text-slate-500 uppercase">{r.sector} | {r.date}</p>
                            </div>
                            <button className="text-[10px] font-bold text-blue-500 hover:underline uppercase">Consulter</button>
                        </div>
                    ))}
                    {db.reports.length === 0 && <p className="text-slate-600 italic text-sm text-center py-4">Aucun rapport enregistré</p>}
                </div>
            </div>
        </div>

        <div className="glass p-8 rounded-3xl h-fit">
            <h3 className="orbitron text-xs font-bold text-green-400 uppercase tracking-widest mb-8">Unités Actives</h3>
            <div className="space-y-4">
                {onDuty && (
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-green-500/5 border border-green-500/20">
                        <div className="w-2 h-2 rounded-full bg-green-500 active-pulse"></div>
                        <div>
                            <p className="text-xs font-bold uppercase italic">{user.fullname}</p>
                            <p className="text-[9px] text-slate-500 uppercase font-mono tracking-tighter">Patrol — {user.grade}</p>
                        </div>
                    </div>
                )}
                {!onDuty && <p className="text-slate-600 italic text-xs text-center">Aucune unité en service</p>}
            </div>
        </div>
    </div>
);

const StatCard = ({ label, val, color }) => (
    <div className={`glass p-6 rounded-2xl border-b-4 border-${color}-500/50`}>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl orbitron font-black">{val}</p>
    </div>
);

// --- VUE RAPPORTS (DYNAMIQUE 1-7 INTERVENTIONS) ---
const ServiceReports = ({ db, setDb, user }) => {
    const [interventions, setInterventions] = useState([{ id: 1, time: '', loc: '', type: '', desc: '' }]);

    const addIntervention = () => {
        if (interventions.length < 7) {
            setInterventions([...interventions, { id: Date.now(), time: '', loc: '', type: '', desc: '' }]);
        }
    };

    const handleSave = (e) => {
        e.preventDefault();
        const report = {
            id: Date.now(),
            badge: e.target.badge.value,
            unit: e.target.unit.value,
            sector: e.target.sector.value,
            date: new Date().toLocaleDateString(),
            interventions: interventions,
            officer: user.fullname
        };
        setDb({ ...db, reports: [...db.reports, report] });
        alert("Rapport enregistré !");
    };

    return (
        <form onSubmit={handleSave} className="space-y-8 glass p-10 rounded-3xl max-w-5xl mx-auto">
            <div className="grid grid-cols-3 gap-6">
                <div class="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Matricule / Badge</label>
                    <input name="badge" required className="w-full p-4 rounded-xl" placeholder="Ex: #8821" />
                </div>
                <div class="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Indicatif Unité</label>
                    <input name="unit" required className="w-full p-4 rounded-xl" placeholder="Ex: Adam-10" />
                </div>
                <div class="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Secteur de Patrouille</label>
                    <input name="sector" required className="w-full p-4 rounded-xl" placeholder="Ex: Davis / South LS" />
                </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-white/5">
                <div className="flex justify-between items-center">
                    <h4 className="orbitron text-xs font-bold text-blue-400 uppercase tracking-widest">Journal des Interventions ({interventions.length}/7)</h4>
                    <button type="button" onClick={addIntervention} className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-4 py-2 rounded-lg border border-blue-500/20 hover:bg-blue-600 hover:text-white">+ Ajouter</button>
                </div>

                {interventions.map((int, index) => (
                    <div key={int.id} className="p-6 bg-white/5 border border-white/5 rounded-2xl relative">
                        <span className="absolute -left-3 top-1/2 -translate-y-1/2 bg-blue-600 text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full shadow-lg">{index + 1}</span>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <input className="p-3 rounded-lg text-xs" placeholder="Heure (HH:MM)" />
                            <input className="p-3 rounded-lg text-xs" placeholder="Lieu exact" />
                            <input className="p-3 rounded-lg text-xs" placeholder="Type d'appel / Code" />
                        </div>
                        <textarea className="w-full p-4 rounded-xl text-xs h-20" placeholder="Description de l'action et résultat..."></textarea>
                    </div>
                ))}
            </div>

            <button type="submit" className="w-full py-5 rounded-2xl bg-blue-600 text-white font-bold orbitron uppercase tracking-[0.3em] shadow-xl shadow-blue-600/20 hover:bg-blue-500">Transmettre le Rapport au Commandement</button>
        </form>
    );
};

// --- VUE LOGIN ---
const LoginView = ({ onLogin }) => (
    <div className="h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 z-0 opacity-20">
            <img src="https://images.unsplash.com/photo-1566438480900-0609be27a4be?auto=format&fit=crop&w=1920&q=80" className="w-full h-full object-cover" />
        </div>
        <div className="glass p-12 rounded-[2.5rem] w-full max-w-md relative z-10 text-center animate-fadeIn">
            <img src="https://i.imgur.com/eW47qCV.png" className="w-24 h-24 mx-auto mb-8 drop-shadow-[0_0_15px_rgba(0,132,255,0.5)]" />
            <h1 className="orbitron text-2xl font-black italic tracking-tighter uppercase mb-2">MDT Access Control</h1>
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.3em] mb-10">Los Angeles Police Department</p>
            
            <form onSubmit={onLogin} className="space-y-4 text-left">
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Matricule Officier</label>
                    <input name="matricule" required className="w-full p-4 rounded-2xl mt-1 text-sm font-mono" placeholder="4002" />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Clé d'Accès Sécurisée</label>
                    <input name="password" type="password" required className="w-full p-4 rounded-2xl mt-1 text-sm font-mono" placeholder="••••••••" />
                </div>
                <button type="submit" className="w-full py-5 rounded-2xl bg-blue-600 text-white font-bold orbitron uppercase tracking-widest mt-6 shadow-xl shadow-blue-600/30 hover:scale-[1.02] active:scale-[0.98]">Initialiser Connexion</button>
            </form>
            <p className="mt-12 text-[8px] text-slate-700 font-bold uppercase tracking-[0.2em]">Usage strictement réservé au personnel du LAPD autorisé. Toute intrusion sera tracée.</p>
        </div>
    </div>
);

// Fallbacks
const Citizens = () => <div className="p-10 text-center text-slate-500 italic">Module Citoyens prêt pour implémentation CRUD...</div>;
const CriminalRecords = () => <div className="p-10 text-center text-slate-500 italic">Système de Casier Judiciaire centralisé...</div>;
const AdminPanel = () => <div className="p-10 text-center text-slate-500 italic">Panel État-Major : Gestion des comptes et grades...</div>;
const Investigations = () => <div className="p-10 text-center text-slate-500 italic">Bureau des Détectives : Enquêtes en cours...</div>;
const AccessDenied = () => <div className="p-20 text-center text-red-600 orbitron font-bold">ACCÈS REFUSÉ - DROITS INSUFFISANTS</div>;

// --- DÉMARRAGE ---
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
            const { useState, useEffect } = React;

// --- COMPOSANT : RAPPORTS (Interventions Illimitées) ---
const ServiceReportView = () => {
    const [interventions, setInterventions] = useState([
        { id: Date.now(), time: '', loc: '', type: '', note: '' }
    ]);

    const addInt = () => setInterventions([...interventions, { id: Date.now(), time: '', loc: '', type: '', note: '' }]);
    
    const removeInt = (id) => {
        if (interventions.length > 1) setInterventions(interventions.filter(i => i.id !== id));
    };

    return (
        <div className="space-y-6 animate-slide">
            <div className="flex justify-between items-center mb-8">
                <h2 className="orbitron text-2xl font-bold italic text-white uppercase tracking-tighter">Rédaction de Rapport</h2>
                <div className="text-[10px] bg-blue-500/10 text-blue-400 px-4 py-2 rounded-full border border-blue-500/20 font-bold">
                    ID RAPPORT : #{Math.floor(Math.random() * 99999)}
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-8">
                <InputGroup label="Officier" placeholder="Nom Prénom" />
                <InputGroup label="Badge" placeholder="#0000" />
                <InputGroup label="Unité" placeholder="Adam-10" />
                <InputGroup label="Secteur" placeholder="Mission Row" />
            </div>

            <div className="glass-panel p-6 rounded-3xl max-h-[500px] overflow-y-auto custom-scrollbar space-y-4 bg-black/20 border border-white/5">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4">Journal des Interventions</p>
                {interventions.map((int, index) => (
                    <div key={int.id} className="p-6 rounded-2xl bg-white/5 border border-white/5 relative group transition-all hover:bg-white/[0.07]">
                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg">
                            {index + 1}
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-4 ml-4">
                            <input className="bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-white" placeholder="Heure (ex: 22:30)" />
                            <input className="bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-white" placeholder="Lieu" />
                            <input className="bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-white" placeholder="Type d'appel" />
                        </div>
                        <textarea className="w-full ml-4 bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-white h-20" placeholder="Description détaillée..." />
                        
                        <button onClick={() => removeInt(int.id)} className="absolute top-4 right-4 text-red-500/50 hover:text-red-500 transition-colors">
                            <i data-lucide="x-circle" className="w-5 h-5"></i>
                        </button>
                    </div>
                ))}
            </div>

            <div className="flex gap-4">
                <button onClick={addInt} className="flex-1 py-4 rounded-2xl border-2 border-dashed border-blue-500/20 text-blue-400 font-bold text-xs hover:bg-blue-500/5 transition-all uppercase tracking-widest">
                    + Ajouter une intervention
                </button>
                <button className="flex-1 py-4 rounded-2xl bg-blue-600 text-white font-bold text-xs orbitron shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all uppercase">
                    Soumettre au bureau du Procureur
                </button>
            </div>
        </div>
    );
};

// --- COMPOSANT : DISPATCH (Visuel Grille) ---
const DispatchGrid = () => (
    <div className="grid grid-cols-4 gap-6 animate-slide">
        <DispatchCard icon="radio" title="Radios" desc="Gestion des fréquences SO/NO" status="Online" />
        <DispatchCard icon="map-pin" title="Citizen Search" desc="Recherche base de données" status="Active" />
        <DispatchCard icon="file-text" title="Reports" desc="Derniers rapports soumis" count="12" />
        <DispatchCard icon="car" title="Vehicles" desc="Plaques et modèles" count="450" />
        <DispatchCard icon="alert-triangle" title="Search & Capture" desc="Mandats d'arrêts actifs" count="3" color="red" />
        <DispatchCard icon="video" title="Security Cameras" desc="Accès caméras de ville" status="10 Active" />
        <DispatchCard icon="users" title="Agents" desc="Gestion de l'effectif" status="15 Duty" />
        <DispatchCard icon="activity" title="Radio Alpha" desc="Frequence prioritaire" status="Adam-20" />
    </div>
);

// --- COMPOSANT : CAMÉRAS (Style image_ac683b) ---
const CameraView = () => (
    <div className="space-y-6 animate-slide">
        <h2 className="orbitron text-xl font-bold text-white mb-6 uppercase italic">Surveillance Réseau</h2>
        <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(cam => (
                <div key={cam} className="glass-panel rounded-2xl overflow-hidden border border-white/5 group">
                    <div className="aspect-video bg-black flex items-center justify-center relative">
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                            <span className="text-[9px] font-bold text-white uppercase tracking-widest">CAM-{cam} | LIVE</span>
                        </div>
                        <i data-lucide="video-off" className="w-10 h-10 text-white/5 group-hover:text-blue-500/20 transition-colors"></i>
                        <div className="absolute bottom-3 right-3 text-[8px] text-white/40 font-mono italic">MISSION ROW — 12.64m</div>
                    </div>
                    <div className="p-4 bg-white/5 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secteur Nord</span>
                        <button className="p-2 bg-blue-600 rounded-lg"><i data-lucide="play" className="w-3 h-3 text-white"></i></button>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// Helpers
const InputGroup = ({ label, placeholder }) => (
    <div className="space-y-1">
        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">{label}</label>
        <input className="w-full bg-white/5 border border-white/5 p-4 rounded-xl text-xs text-white outline-none focus:border-blue-500/50 transition-all" placeholder={placeholder} />
    </div>
);

const DispatchCard = ({ icon, title, desc, status, count, color = "blue" }) => (
    <div className={`glass-panel p-6 rounded-3xl border border-white/5 hover:border-${color}-500/30 transition-all cursor-pointer group relative overflow-hidden`}>
        <div className={`absolute -right-4 -bottom-4 text-${color}-500/5 group-hover:scale-110 transition-transform`}>
            <i data-lucide={icon} className="w-24 h-24"></i>
        </div>
        <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg bg-${color}-500/10 text-${color}-400`}>
                <i data-lucide={icon} className="w-4 h-4"></i>
            </div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">{title}</h3>
        </div>
        <p className="text-[10px] text-slate-500 mb-4 pr-6 leading-relaxed">{desc}</p>
        <div className="flex justify-between items-end">
            <span className={`text-[9px] font-black uppercase text-${color}-500 tracking-tighter`}>{status || count}</span>
            <i data-lucide="chevron-right" className="w-3 h-3 text-slate-600 group-hover:translate-x-1 transition-transform"></i>
        </div>
    </div>
);

// Re-init icons after renders
setTimeout(() => lucide.createIcons(), 500);
