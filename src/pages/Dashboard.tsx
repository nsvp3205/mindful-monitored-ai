import { useState } from "react";
import logo from "@/assets/logo.jpg";
import {
  LayoutDashboard,
  Bell,
  MessageSquare,
  Smile,
  AlertTriangle,
  Users,
  Settings,
  Plus,
  Check,
  X,
  Clock,
  Mic,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Mock data
const initialReminders = [
  { id: 1, title: "Morning Medication", time: "08:00 AM", type: "medication", status: "completed" as const },
  { id: 2, title: "Blood Pressure Check", time: "10:00 AM", type: "health", status: "completed" as const },
  { id: 3, title: "Afternoon Walk", time: "02:00 PM", type: "routine", status: "pending" as const },
  { id: 4, title: "Evening Medication", time: "06:00 PM", type: "medication", status: "pending" as const },
  { id: 5, title: "Call with Dr. Smith", time: "04:00 PM", type: "appointment", status: "missed" as const },
];

const conversations = [
  { id: 1, time: "08:15 AM", preview: "Good morning! How did you sleep last night?", mood: "happy" },
  { id: 2, time: "12:30 PM", preview: "Time for your afternoon check-in! Have you eaten lunch?", mood: "neutral" },
  { id: 3, time: "Yesterday", preview: "I noticed you seemed a bit tired. Would you like me to remind you to rest?", mood: "sad" },
];

const alerts = [
  { id: 1, message: "Evening medication was missed yesterday", severity: "high", time: "Yesterday 7:00 PM" },
  { id: 2, message: "Mood has been declining over the past 3 days", severity: "medium", time: "Today" },
];

const moodHistory = [
  { day: "Mon", mood: "happy" },
  { day: "Tue", mood: "happy" },
  { day: "Wed", mood: "neutral" },
  { day: "Thu", mood: "sad" },
  { day: "Fri", mood: "neutral" },
  { day: "Sat", mood: "happy" },
  { day: "Sun", mood: "happy" },
];

const moodEmoji: Record<string, string> = { happy: "😊", neutral: "😐", sad: "😢" };

type NavSection = "overview" | "reminders" | "conversations" | "mood" | "alerts" | "caregiver";

const navItems: { key: NavSection; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "reminders", label: "Reminders", icon: Bell },
  { key: "conversations", label: "Conversations", icon: MessageSquare },
  { key: "mood", label: "Mood", icon: Smile },
  { key: "alerts", label: "Alerts", icon: AlertTriangle },
  { key: "caregiver", label: "Caregiver", icon: Users },
];

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState<NavSection>("overview");
  const [reminders, setReminders] = useState(initialReminders);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [newReminder, setNewReminder] = useState({ title: "", time: "", type: "medication" });
  const [dialogOpen, setDialogOpen] = useState(false);

  const addReminder = () => {
    if (!newReminder.title || !newReminder.time) return;
    setReminders([
      ...reminders,
      { id: Date.now(), ...newReminder, status: "pending" as const },
    ]);
    setNewReminder({ title: "", time: "", type: "medication" });
    setDialogOpen(false);
  };

  const toggleReminder = (id: number) => {
    setReminders(reminders.map((r) =>
      r.id === id ? { ...r, status: r.status === "completed" ? "pending" : "completed" } : r
    ));
  };

  const deleteReminder = (id: number) => {
    setReminders(reminders.filter((r) => r.id !== id));
  };

  const completedCount = reminders.filter((r) => r.status === "completed").length;
  const missedCount = reminders.filter((r) => r.status === "missed").length;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-full border-r border-border bg-card transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-16"
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-border px-4">
          <img src={logo} alt="VivaVoice" className="h-9 w-9 rounded-xl object-cover flex-shrink-0" />
          {sidebarOpen && <span className="font-bold text-foreground">VivaVoice</span>}
        </div>
        <nav className="mt-4 space-y-1 px-2">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveSection(item.key)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                activeSection === item.key
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-4 px-2 w-full space-y-1">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted"
          >
            <Settings className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-16"}`}>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-lg">
          <h1 className="text-xl font-bold text-foreground capitalize">{activeSection}</h1>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/">
              <Button variant="ghost" size="sm">Home</Button>
            </Link>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* OVERVIEW */}
          {activeSection === "overview" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Reminders Today" value={String(reminders.length)} icon={Bell} />
                <StatCard label="Completed" value={String(completedCount)} icon={Check} color="text-success" />
                <StatCard label="Missed" value={String(missedCount)} icon={X} color="text-destructive" />
                <StatCard label="Alerts" value={String(alerts.length)} icon={AlertTriangle} color="text-warning" />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Reminders */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                  <h3 className="text-lg font-semibold text-card-foreground mb-4">Today's Reminders</h3>
                  <div className="space-y-3">
                    {reminders.slice(0, 4).map((r) => (
                      <ReminderRow key={r.id} reminder={r} onToggle={toggleReminder} onDelete={deleteReminder} />
                    ))}
                  </div>
                </div>

                {/* Mood Summary */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                  <h3 className="text-lg font-semibold text-card-foreground mb-4">This Week's Mood</h3>
                  <div className="flex justify-between">
                    {moodHistory.map((m) => (
                      <div key={m.day} className="flex flex-col items-center gap-2">
                        <span className="text-2xl">{moodEmoji[m.mood]}</span>
                        <span className="text-xs text-muted-foreground">{m.day}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Conversations */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <h3 className="text-lg font-semibold text-card-foreground mb-4">Recent Conversations</h3>
                <div className="space-y-4">
                  {conversations.map((c) => (
                    <div key={c.id} className="flex items-start gap-4 rounded-xl bg-muted/50 p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                        <Mic className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-card-foreground">{c.preview}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{c.time} · {moodEmoji[c.mood]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* REMINDERS */}
          {activeSection === "reminders" && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-card-foreground">All Reminders</h3>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-primary text-primary-foreground gap-2">
                      <Plus className="h-4 w-4" /> Add Reminder
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>New Reminder</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          placeholder="e.g. Morning Medication"
                          value={newReminder.title}
                          onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Time</Label>
                        <Input
                          placeholder="e.g. 08:00 AM"
                          value={newReminder.time}
                          onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {["medication", "health", "routine"].map((type) => (
                            <button
                              key={type}
                              onClick={() => setNewReminder({ ...newReminder, type })}
                              className={`rounded-lg border p-2 text-xs font-medium capitalize transition-all ${
                                newReminder.type === type
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border text-muted-foreground"
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                      <Button onClick={addReminder} className="w-full bg-primary text-primary-foreground">
                        Add Reminder
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-3">
                {reminders.map((r) => (
                  <ReminderRow key={r.id} reminder={r} onToggle={toggleReminder} onDelete={deleteReminder} />
                ))}
              </div>
            </div>
          )}

          {/* CONVERSATIONS */}
          {activeSection === "conversations" && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">Conversation History</h3>
              <div className="space-y-4">
                {conversations.map((c) => (
                  <div key={c.id} className="flex items-start gap-4 rounded-xl bg-muted/50 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                      <Mic className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-card-foreground">{c.preview}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{c.time} · Mood: {moodEmoji[c.mood]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MOOD */}
          {activeSection === "mood" && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h3 className="text-lg font-semibold text-card-foreground mb-6">Mood History</h3>
              <div className="grid grid-cols-7 gap-4">
                {moodHistory.map((m) => (
                  <div key={m.day} className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-muted/30 p-4">
                    <span className="text-3xl">{moodEmoji[m.mood]}</span>
                    <span className="text-sm font-medium text-foreground">{m.day}</span>
                    <span className="text-xs text-muted-foreground capitalize">{m.mood}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ALERTS */}
          {activeSection === "alerts" && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">Caregiver Alerts</h3>
              <div className="space-y-3">
                {alerts.map((a) => (
                  <div
                    key={a.id}
                    className={`flex items-start gap-4 rounded-xl p-4 ${
                      a.severity === "high" ? "bg-destructive/10 border border-destructive/20" : "bg-warning/10 border border-warning/20"
                    }`}
                  >
                    <AlertTriangle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                      a.severity === "high" ? "text-destructive" : "text-warning"
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{a.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CAREGIVER */}
          {activeSection === "caregiver" && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">Caregiver Information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">Primary Caregiver</p>
                  <p className="text-sm font-semibold text-foreground mt-1">Sarah Johnson</p>
                  <p className="text-xs text-muted-foreground mt-1">sarah@example.com · (555) 123-4567</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">Emergency Contact</p>
                  <p className="text-sm font-semibold text-foreground mt-1">Dr. Michael Smith</p>
                  <p className="text-xs text-muted-foreground mt-1">dr.smith@clinic.com · (555) 987-6543</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: typeof Bell; color?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className={`h-5 w-5 ${color || "text-primary"}`} />
      </div>
      <p className="mt-2 text-3xl font-bold text-card-foreground">{value}</p>
    </div>
  );
}

function ReminderRow({
  reminder,
  onToggle,
  onDelete,
}: {
  reminder: { id: number; title: string; time: string; type: string; status: string };
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-3">
      <button
        onClick={() => onToggle(reminder.id)}
        className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 transition-colors ${
          reminder.status === "completed"
            ? "bg-success text-success-foreground"
            : reminder.status === "missed"
            ? "bg-destructive text-destructive-foreground"
            : "border border-border text-muted-foreground hover:bg-primary/10"
        }`}
      >
        {reminder.status === "completed" ? <Check className="h-4 w-4" /> : reminder.status === "missed" ? <X className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
      </button>
      <div className="flex-1">
        <p className={`text-sm font-medium ${reminder.status === "completed" ? "line-through text-muted-foreground" : "text-card-foreground"}`}>
          {reminder.title}
        </p>
        <p className="text-xs text-muted-foreground">{reminder.time} · {reminder.type}</p>
      </div>
      <button onClick={() => onDelete(reminder.id)} className="text-muted-foreground hover:text-destructive transition-colors">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default Dashboard;
