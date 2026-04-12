const steps = [
  {
    number: "01",
    title: "Sign Up & Set Up",
    description: "Create an account and set up your loved one's profile with preferences and schedule.",
  },
  {
    number: "02",
    title: "Configure Reminders",
    description: "Add medication schedules, daily routines, and appointment reminders.",
  },
  {
    number: "03",
    title: "Daily Check-ins Begin",
    description: "VivaVoice calls your loved one daily for friendly conversations and reminders.",
  },
  {
    number: "04",
    title: "Stay Connected",
    description: "View mood reports, activity logs, and receive alerts on your caregiver dashboard.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-muted/40">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            How it works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Getting started with VivaVoice is simple and takes just minutes.
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.number} className="relative text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl font-extrabold text-2xl bg-primary text-primary-foreground shadow-card">
                {s.number}
              </div>
              <h3 className="text-lg font-semibold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
