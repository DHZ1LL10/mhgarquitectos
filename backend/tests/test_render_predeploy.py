from unittest.mock import patch

import pytest

from app.scripts import render_predeploy


def test_predeploy_runs_alembic_operations_in_order(capsys):
    operations = []
    with (
        patch.object(render_predeploy, "Config") as config_class,
        patch.object(
            render_predeploy.command,
            "upgrade",
            side_effect=lambda *_: operations.append("upgrade"),
        ) as upgrade,
        patch.object(
            render_predeploy.command,
            "current",
            side_effect=lambda *_: operations.append("current"),
        ) as current,
        patch.object(
            render_predeploy.command,
            "check",
            side_effect=lambda *_: operations.append("check"),
        ) as check,
    ):
        config = config_class.return_value
        render_predeploy.main()

    config_class.assert_called_once_with("alembic.ini")
    upgrade.assert_called_once_with(config, "head")
    current.assert_called_once_with(config)
    check.assert_called_once_with(config)
    assert operations == ["upgrade", "current", "check"]
    output = capsys.readouterr().out
    assert "migration checks complete" in output
    assert "DATABASE_URL" not in output
    assert "postgresql://" not in output


def test_predeploy_propagates_alembic_failures():
    with (
        patch.object(render_predeploy, "Config"),
        patch.object(render_predeploy.command, "upgrade", side_effect=RuntimeError("failed")),
        patch.object(render_predeploy.command, "current") as current,
        patch.object(render_predeploy.command, "check") as check,
        pytest.raises(RuntimeError, match="failed"),
    ):
        render_predeploy.main()

    current.assert_not_called()
    check.assert_not_called()
