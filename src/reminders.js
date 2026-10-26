// Recordatorios de programas: "avísame cuando empiece Telenoticias".
import { load, save } from './store.js';

let reminders = load('reminders', []);

function id(channelKey, start) {
  return channelKey + '@' + start;
}

export function hasReminder(channelKey, start) {
  return reminders.some(r => r.id === id(channelKey, start));
}

// Devuelve true si quedó puesto, false si se quitó.
export function toggleReminder(channel, program) {
  const rid = id(channel.key, program.start);
  const was = hasReminder(channel.key, program.start);
  reminders = was ? reminders.filter(r => r.id !== rid)
    : reminders.concat([{ id: rid, key: channel.key, channel: channel.name, title: program.title, start: program.start }]);
  save('reminders', reminders);
  return !was;
}

// Recordatorios que empiezan en el próximo minuto (o empezaron hace menos de 5). Se borran al devolverlos.
export function dueReminders(now) {
  const due = reminders.filter(r => r.start - now <= 60000 && now - r.start < 5 * 60000);
  if (due.length || reminders.some(r => now - r.start >= 5 * 60000)) {
    reminders = reminders.filter(r => r.start - now > 60000);
    save('reminders', reminders);
  }
  return due;
}
