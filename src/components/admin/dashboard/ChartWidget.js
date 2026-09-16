"use client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

export default function ChartWidget({ title, type = 'bar', data = [], dataKey = "value", nameKey = "name", colors = ['#0F766E'] }) {
  return (
    <div className="bg-white/60 backdrop-blur-md border border-white/80 rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] h-96 flex flex-col">
      <h3 className="text-xl font-black text-teal-950 mb-6">{title}</h3>
      <div className="flex-1 w-full min-h-0">
        {data.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-teal-800/50 font-medium">
            Belum ada data.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {type === 'bar' ? (
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey={nameKey} tick={{ fill: '#0F766E', opacity: 0.7, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#0F766E', opacity: 0.7, fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#0F766E', opacity: 0.1 }}
                  contentStyle={{ borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.6)', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', color: '#0F766E', fontWeight: 'bold' }}
                />
                <Bar dataKey={dataKey} fill={colors[0]} radius={[8, 8, 8, 8]} />
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey={dataKey}
                  nameKey={nameKey}
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={"cell-" + index} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.6)', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', color: '#0F766E', fontWeight: 'bold' }}
                />
              </PieChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
