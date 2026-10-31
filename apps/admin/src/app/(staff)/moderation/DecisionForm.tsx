import { moderateAction } from './actions';

/** Boutons Valider / Refuser avec motif facultatif (transmis à l'auteur en cas de refus). */
export function DecisionForm({ target, id }: { target: string; id: string }) {
  return (
    <form action={moderateAction} className="row">
      <input type="hidden" name="target" value={target} />
      <input type="hidden" name="id" value={id} />
      <input name="reason" placeholder="Motif (facultatif)" maxLength={500} aria-label="Motif" />
      <button className="primary" type="submit" name="decision" value="approve">
        Valider
      </button>
      <button className="danger" type="submit" name="decision" value="reject">
        Refuser
      </button>
    </form>
  );
}
