import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { NamedEntity } from "./named_entity";
import { BehavioralEntity } from "./behavioral_entity";
import { ContainerEntity } from "./container_entity";
import { Entity } from "./entity";

export class Invocation extends Entity {

  private _candidates: Set<BehavioralEntity> = new Set();

  public addCandidate(candidate: BehavioralEntity): void {  
    if (!this._candidates.has(candidate)) {
      this._candidates.add(candidate);
      candidate.addIncomingInvocation(this);
    }
  }

  private _receiver!: NamedEntity;
  private _sender!: ContainerEntity;
  private _signature!: string;

  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("Invocation", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
    exporter.addProperty("candidates", this.candidates);
    exporter.addProperty("receiver", this.receiver);
    exporter.addProperty("sender", this.sender);
    exporter.addProperty("signature", this.signature);
  }

    get candidates() {
        return this._candidates;
    }

    get receiver() {
        return this._receiver;
    }

    set receiver(receiver: NamedEntity) {
        this._receiver = receiver;
        receiver.addReceivedInvocation(this);
    }

    get sender() {
        return this._sender;
    }

    set sender(sender: ContainerEntity) {
        this._sender = sender;
        sender.addOutgoingInvocation(this);
    }

    get signature() {
        return this._signature;
    }

    set signature(signature: string) {
        this._signature = signature;
    }
}
