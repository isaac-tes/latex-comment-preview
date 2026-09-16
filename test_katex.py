# %%
r"""
Bosonic Bogoliubov-de Gennes GPE N-Band Model

Generalization of :class:`SymplecticTwoBandBogoliubovModel` to an **arbitrary
number of bands** $N$.  The two-band model parametrizes the condensate by Bloch
angles $(\theta,\varphi)$ and solves three coupled mean-field equations; that
description is specific to a two-level system.  Here the condensate is a general
$N$-component spinor $f$ at the condensation momentum $\mathbf{k}_0$, obtained
either by solving the multi-component Gross-Pitaevskii equation self-consistently
or supplied explicitly (needed when the condensation band is degenerate, e.g. a
flat band, where the mean-field ground state is a *manifold* and a symmetry
sector must be chosen rather than minimized to).

Mathematical background
-----------------------
For a per-orbital contact interaction the mean-field structure of the two-band
model carries over verbatim with $F_- = \mathrm{diag}(f_1,\dots,f_N)$:

$$
\mathcal{M}(\mathbf{q}) = \begin{pmatrix}
    \mathcal{H}(\mathbf{k}_0+\mathbf{q}) + \mathcal{H}_1 & 2\mathcal{H}_2 \\
    2\mathcal{H}_2^{*} & (\mathcal{H}(\mathbf{k}_0-\mathbf{q}) + \mathcal{H}_1)^{*}
\end{pmatrix},
\qquad
\mathcal{H}_1 = 4Un\,\mathrm{diag}(|f_s|^2) - \mu_\mathrm{eff}\mathbb{1}_N,
\qquad
\mathcal{H}_2 = Un\,\mathrm{diag}(f_s^2),
$$

with the condensate obeying the multi-component GPE

$$
\bigl[\mathcal{H}(\mathbf{k}_0) + 2Un\,\mathrm{diag}(|f_s|^2)\bigr]\,f = \mu f,
\qquad \sum_s |f_s|^2 = 1,
$$

and the (number-conserving) effective chemical potential

$$
\mu_\mathrm{eff} = \langle f | \mathcal{H}(\mathbf{k}_0) | f\rangle
                 + 2Un \sum_s |f_s|^4 .
$$

Because the GPE eigenvalue satisfies $\mu = \langle f|\mathcal{H}(\mathbf{k}_0) +
2Un\,\mathrm{diag}(|f_s|^2)|f\rangle = \mu_\mathrm{eff}$, the self-consistent
eigenvalue *is* the effective chemical potential.  For $N=2$ this reduces exactly
to the $(\theta,\varphi)$ three-equation solution of
:class:`SymplecticTwoBandBogoliubovModel`; the reduction is checked to
floating-point precision in the test suite.

References
----------
.. [1] I. Tesfaye and A. Eckardt, Quantum geometry of bosonic Bogoliubov
       quasiparticles, Phys. Rev. Res. 7, L042052 (2025).
"""