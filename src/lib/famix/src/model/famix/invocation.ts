import { FamixJSONExporter } from "../../famix_JSON_exporter";
import { NamedEntity } from "./named_entity";
import { BehavioralEntity } from "./behavioral_entity";
import { ContainerEntity } from "./container_entity";
import { Entity } from "./entity";

export class Invocation extends Entity {

  private candidates: Set<BehavioralEntity> = new Set();

  public getCandidates(): Set<BehavioralEntity> {
    return this.candidates;
  }

  public addCandidate(candidate: BehavioralEntity): void {  
    if (!this.candidates.has(candidate)) {
      this.candidates.add(candidate);
      candidate.addIncomingInvocation(this);
    }
  }

  private receiver: NamedEntity;

  public getReceiver(): NamedEntity {
    return this.receiver;
  }

  public setReceiver(receiver: NamedEntity): void {
    this.receiver = receiver;
    receiver.addReceivedInvocation(this);
  }

  private sender: ContainerEntity;

  public getSender(): ContainerEntity {
    return this.sender;
  }

  public setSender(sender: ContainerEntity): void {
    this.sender = sender;
    sender.addOutgoingInvocation(this);
  }

  private signature: string;

  public getSignature(): string {
    return this.signature;
  }

  public setSignature(signature: string): void {
    this.signature = signature;
  }


  public getJSON(): string {
    const json: FamixJSONExporter = new FamixJSONExporter("Invocation", this);
    this.addPropertiesToExporter(json);
    return json.getJSON();
  }

  public addPropertiesToExporter(exporter: FamixJSONExporter): void {
    super.addPropertiesToExporter(exporter);
    exporter.addProperty("candidates", this.getCandidates());
    exporter.addProperty("receiver", this.getReceiver());
    exporter.addProperty("sender", this.getSender());
    exporter.addProperty("signature", this.getSignature());
  }
}
