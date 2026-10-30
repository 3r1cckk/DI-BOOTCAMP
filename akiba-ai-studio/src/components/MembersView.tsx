import React from 'react';
import { UserMinus, UserPlus, CheckCircle2 } from 'lucide-react';
import { Member, formatKES } from './utils/chamaCalculations';

interface MembersViewProps {
  members: Member[];
  onOpenAddMember: () => void;
  onRemoveMember: (member: Member) => void;
  onUpdateMember: (member: Member, changes: { role?: Member['role']; status?: Member['status'] }) => void;
  searchQuery: string;
}

export const MembersView: React.FC<MembersViewProps> = ({
  members,
  onOpenAddMember,
  onRemoveMember,
  onUpdateMember,
  searchQuery,
}) => {
  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.phone.includes(searchQuery) ||
    m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.idNumber.includes(searchQuery)
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Chama Member Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {members.filter((member) => member.status === 'active').length} active registered members
          </p>
        </div>

        <button
          onClick={onOpenAddMember}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer w-fit"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Member</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Member Name</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Contact & ID</th>
                <th className="px-5 py-3.5">Monthly Pledge</th>
                <th className="px-5 py-3.5">Total Saved</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td className="px-5 py-10 text-center text-slate-500" colSpan={7}>
                    {members.length === 0 ? 'No members added yet.' : 'No members match your search.'}
                  </td>
                </tr>
              ) : filtered.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-900">{member.name}</div>
                    <div className="text-[11px] text-slate-400">Joined {member.joinedDate}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                      member.role === 'chairperson'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : member.role === 'treasurer'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : member.role === 'secretary'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : member.role === 'admin'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      <select
                        aria-label={`Role for ${member.name}`}
                        className="bg-transparent outline-none"
                        onChange={(event) => onUpdateMember(member, { role: event.target.value as Member['role'] })}
                        value={member.role}
                      >
                        <option value="member">Member</option>
                        <option value="treasurer">Treasurer</option>
                        <option value="secretary">Secretary</option>
                        <option value="chairperson">Chairperson</option>
                        <option value="admin">Admin</option>
                      </select>
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-600">
                    <div>{member.phone}</div>
                    <div className="text-[10px] text-slate-400 font-sans">ID: {member.idNumber}</div>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-slate-800">
                    {formatKES(member.monthlyPledge)}
                  </td>
                  <td className="px-5 py-3.5 font-bold text-emerald-700">
                    {formatKES(member.totalSaved)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`flex items-center gap-1 font-semibold ${
                      member.status === 'active' ? 'text-emerald-600' : member.status === 'pending' ? 'text-amber-600' : 'text-slate-500'
                    }`}>
                      {member.status === 'active' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {member.status === 'active' ? 'Active' : member.status === 'pending' ? 'Pending' : member.status === 'rejected' ? 'Rejected' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {member.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onUpdateMember(member, { status: 'active' })}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-700"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateMember(member, { status: 'rejected' })}
                          className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {member.status === 'active' && (
                      <button
                        type="button"
                        onClick={() => onRemoveMember(member)}
                        aria-label={`Remove ${member.name}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        <UserMinus className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
