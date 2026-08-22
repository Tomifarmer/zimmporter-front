import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";

describe("ConfirmDeleteDialog", () => {
  it("renders nothing when not visible", () => {
    render(
      <ConfirmDeleteDialog
        visible={false}
        title="Delete job"
        message="Delete job #1?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows title and message when visible", () => {
    render(
      <ConfirmDeleteDialog
        visible={true}
        title="Delete job"
        message="Delete job #1? This cannot be undone."
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Delete job");
    expect(dialog).toHaveTextContent("Delete job #1? This cannot be undone.");
  });

  it("invokes onConfirm from the Delete button", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ConfirmDeleteDialog
        visible={true}
        title="Delete jobs"
        message="Delete 2 selected job(s)?"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("invokes onCancel from the Cancel button", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <ConfirmDeleteDialog
        visible={true}
        title="Delete job"
        message="Delete job #3?"
        onConfirm={() => {}}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("disables interaction while pending", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <ConfirmDeleteDialog
        visible={true}
        title="Delete job"
        message="Deleting…"
        pending={true}
        onConfirm={() => {}}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).not.toHaveBeenCalled();
  });
});
