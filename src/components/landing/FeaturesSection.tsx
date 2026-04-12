import { Mic, Bell, Shield, Smile, Users, Activity } from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "AI Voice Companion",
    description: "Natural daily conversations that provide companionship and mental stimulation.",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    description: "Medication, appointment, and routine reminders with gentle voice prompts.",
  },
  {
    icon: Shield,
    title: "Caregiver Alerts",
    description: "Instant notifications when reminders are missed or distress is detected.",
  },
  {
    icon: Smile,
    title: "Mood Tracking",
    description: "Monitor emotional well-being over time with simple mood assessments.",
  },
  {
    icon: Users,
    title: "Family Dashboard",
    description: "Caregivers can view activity, reminders, and mood trends from anywhere.",
  },
  {
    icon: Activity,
    title: "Health Insights",
    description: "Track patterns in behavior and well-being to support proactive care.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            Everything your loved ones need
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A complete care companion designed with seniors and their families in mind.
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-border bg-card p-8 shadow-card transition-all hover:shadow-elevated hover:-translate-y-1"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-card-foreground">{f.title}</h3>
              <p className="mt-2 text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
