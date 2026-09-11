import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Calendar, Clock, Users, MapPin, GraduationCap, TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { api, formatINR } from "../api/client.js";
import { Card, Button, Input, Select, Label, Modal, PageHeader, LoadingState, EmptyState, ProgressBar, Badge, Avatar } from "../components/ui.jsx";

export default function Batches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", course: "Class 10", teacher: "", days: "Monday, Wednesday, Friday", startTime: "5:00 PM", endTime: "6:30 PM", room: "", capacity: "30" });

  const load = () => {
    setLoading(true);
    api("/api/batches").then((r) => setBatches(r.batches || [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const create = async (e) => {
    e.preventDefault();
    await api("/api/batches", { method: "POST", body: { ...form, days: form.days.split(",").map((d) => d.trim()).filter(Boolean), capacity: Number(form.capacity) } });
    setOpen(false);
    setForm({ name: "", course: "Class 10", teacher: "", days: "Monday, Wednesday, Friday", startTime: "5:00 PM", endTime: "6:30 PM", room: "", capacity: "30" });
    load();
  };

  const getCapacityColor = (fill) => {
    if (fill >= 90) return "danger";
    if (fill >= 70) return "warning";
    return "success";
  };

  const cardAccents = [
    "from-brand-500 to-brand-600",
    "from-purple-500 to-purple-600",
    "from-info-500 to-info-600",
    "from-success-500 to-success-600",
    "from-warning-500 to-warning-600",
    "from-danger-500 to-danger-600",
  ];

  if (loading) return <LoadingState />;
  return (
    <div className="space-y-6 w-full min-w-0 overflow-x-hidden">
      <PageHeader
        title="Batches"
        subtitle={`${batches.length} batches · Capacity and collection at a glance.`}
        action={
          <Button variant="primary" onClick={() => setOpen(true)} className="w-full sm:w-auto shadow-lg shadow-brand-500/25">
            <Plus className="w-4 h-4 mr-2" />Create Batch
          </Button>
        }
      />

      {batches.length === 0 ? (
        <EmptyState
          title="No batches"
          description="Create your first batch to organise students."
          icon={GraduationCap}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full min-w-0">
          {batches.map((b, idx) => {
            const fill = b.capacity ? Math.round(((b.students ?? 0) / b.capacity) * 100) : 0;
            const capColor = getCapacityColor(fill);
            const accent = cardAccents[idx % cardAccents.length];
            return (
              <Link key={b.id} to={`/batches/${b.id}`} className="block min-w-0 group">
                <Card className="p-0 hover:shadow-xl hover:shadow-brand-500/10 hover:-translate-y-1 transition-all duration-300 w-full min-w-0 overflow-hidden border-0 ring-1 ring-slate-200 hover:ring-brand-300">
                  <div className={`h-2 bg-gradient-to-r ${accent}`} />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-base font-bold text-slate-900 truncate group-hover:text-brand-600 transition-colors">{b.name}</div>
                        <div className="text-sm text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                          <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                          {b.course}
                        </div>
                      </div>
                      <Badge variant={b.capacity && b.students >= b.capacity ? "danger" : "success"}>
                        {b.capacity && b.students >= b.capacity ? "Full" : "Open"}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Avatar name={b.teacher || "TBD"} size="xs" />
                        <span className="truncate">{b.teacher || "No teacher"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 shrink-0 text-purple-500" />
                        <span className="truncate text-xs">{(b.days || []).join(" · ")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock className="w-3.5 h-3.5 shrink-0 text-info-500" />
                        <span className="text-xs">{b.startTime} – {b.endTime}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-warning-500" />
                        <span className="text-xs">{b.room || "No room"}</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {b.students ?? 0} / {b.capacity || 0} students
                        </span>
                        <span className="font-semibold text-slate-700">{fill}%</span>
                      </div>
                      <ProgressBar value={fill} color={capColor} />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 mt-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-success-50 to-success-100/50 border border-success-200/50">
                        <div className="text-[11px] text-success-600 font-medium flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Collected
                        </div>
                        <div className="text-sm font-bold text-success-700 mt-0.5">{formatINR(b.collected || 0)}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-gradient-to-br from-warning-50 to-warning-100/50 border border-warning-200/50">
                        <div className="text-[11px] text-warning-600 font-medium flex items-center gap-1">
                          <TrendingDown className="w-3 h-3" />
                          Pending
                        </div>
                        <div className="text-sm font-bold text-warning-700 mt-0.5">{formatINR(b.pending || 0)}</div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Create Batch" width="max-w-lg">
        <form onSubmit={create} className="space-y-4 w-full min-w-0">
          <div className="min-w-0">
            <Label>Batch Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Class 10 — Evening" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
            <div className="min-w-0">
              <Label>Course</Label>
              <Select value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })}>
                <option>Class 9</option>
                <option>Class 10</option>
                <option>Class 11</option>
                <option>Class 12</option>
              </Select>
            </div>
            <div className="min-w-0">
              <Label>Teacher</Label>
              <Input value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })} placeholder="Mr. Rajesh Iyer" />
            </div>
          </div>
          <div className="min-w-0">
            <Label>Days (comma separated)</Label>
            <Input value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
            <div className="min-w-0">
              <Label>Start Time</Label>
              <Input value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </div>
            <div className="min-w-0">
              <Label>End Time</Label>
              <Input value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
            <div className="min-w-0">
              <Label>Room</Label>
              <Input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} placeholder="Room 101" />
            </div>
            <div className="min-w-0">
              <Label>Capacity</Label>
              <Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 w-full">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto shadow-lg shadow-brand-500/25">
              <Sparkles className="w-4 h-4 mr-1.5" />
              Create Batch
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
